import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { generateRecoveryLinkForPayment } from '@/lib/generate-recovery-link';

export async function GET(request: NextRequest) {
  console.log('[Cron Retries] Cron process-retries job started...');

  try {
    // 1. Secret authentication check
    const cronSecretHeader = request.headers.get('x-cron-secret');
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret || cronSecretHeader !== expectedSecret) {
      console.warn('[Cron Retries] Unauthorized attempt to trigger cron job. Secret mismatch or missing.');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Query pending payments where next_retry_at <= now()
    const nowIso = new Date().toISOString();
    console.log(`[Cron Retries] Querying pending payments due for retry at or before ${nowIso}...`);

    const { data: duePayments, error: fetchError } = await supabaseAdmin
      .from('failed_payments')
      .select('*')
      .eq('status', 'pending')
      .lte('next_retry_at', nowIso);

    if (fetchError) {
      console.error('[Cron Retries] Error fetching due payments from Supabase:', fetchError);
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      );
    }

    if (!duePayments || duePayments.length === 0) {
      console.log('[Cron Retries] No pending payments due for retry at this time.');
      return NextResponse.json({
        success: true,
        processed: 0,
        message: 'No pending payments due for retry',
        results: [],
      });
    }

    console.log(`[Cron Retries] Found ${duePayments.length} payment(s) due for retry processing.`);

    const results: Array<{ id: string; strategy: string; action: string; details?: any }> = [];

    // 3. Process each due payment row
    for (const row of duePayments) {
      const strategy = row.retry_strategy || 'manual_review';
      console.log(`[Cron Retries] Processing row ID: ${row.id} | Email: ${row.customer_email} | Strategy: ${strategy} | Retry Count: ${row.retry_count || 0}`);

      if (strategy === 'request_update' || strategy === 'manual_review') {
        // Immediate recovery link generation
        console.log(`[Cron Retries] Row ${row.id}: Strategy "${strategy}" requires immediate recovery link generation.`);
        const linkResult = await generateRecoveryLinkForPayment(row.id);

        results.push({
          id: row.id,
          strategy,
          action: 'generated_recovery_link',
          details: linkResult,
        });

        console.log(`[Cron Retries] Row ${row.id} action completed: Generated recovery link (Status -> retry_scheduled).`);
      } else if (strategy === 'auto_retry_later' || strategy === 'auto_retry_soon') {
        // Increment retry_count
        const currentCount = row.retry_count || 0;
        const newCount = currentCount + 1;

        if (newCount < 2) {
          // Silent retry attempt: Push next_retry_at further out & remain status = pending
          const delayHours = strategy === 'auto_retry_soon' ? 2 : 72;
          const nextRetryDate = new Date(Date.now() + delayHours * 60 * 60 * 1000).toISOString();

          console.log(`[Cron Retries] Row ${row.id}: Silent retry attempt ${newCount}/2. Postponing next retry to +${delayHours}h (${nextRetryDate}).`);

          const { error: updateError } = await supabaseAdmin
            .from('failed_payments')
            .update({
              retry_count: newCount,
              next_retry_at: nextRetryDate,
              updated_at: new Date().toISOString(),
            })
            .eq('id', row.id);

          if (updateError) {
            console.error(`[Cron Retries] Row ${row.id}: Error updating retry_count/next_retry_at:`, updateError);
            results.push({
              id: row.id,
              strategy,
              action: 'error_silent_retry_update',
              details: updateError.message,
            });
          } else {
            results.push({
              id: row.id,
              strategy,
              action: 'silent_retry_postponed',
              details: { new_retry_count: newCount, next_retry_at: nextRetryDate },
            });
          }
        } else {
          // Escalated: reached 2 or more retries -> Generate recovery link & update status = retry_scheduled
          console.log(`[Cron Retries] Row ${row.id}: Reached retry_count=${newCount} (>=2). Escalating to recovery link generation.`);

          // Update retry_count first
          await supabaseAdmin
            .from('failed_payments')
            .update({
              retry_count: newCount,
              updated_at: new Date().toISOString(),
            })
            .eq('id', row.id);

          const linkResult = await generateRecoveryLinkForPayment(row.id);

          results.push({
            id: row.id,
            strategy,
            action: 'escalated_generated_recovery_link',
            details: { new_retry_count: newCount, linkResult },
          });

          console.log(`[Cron Retries] Row ${row.id} action completed: Escalated & generated recovery link.`);
        }
      } else {
        // Fallback for unknown strategies -> Generate recovery link
        console.log(`[Cron Retries] Row ${row.id}: Unknown strategy "${strategy}". Generating recovery link fallback.`);
        const linkResult = await generateRecoveryLinkForPayment(row.id);

        results.push({
          id: row.id,
          strategy,
          action: 'fallback_generated_recovery_link',
          details: linkResult,
        });
      }
    }

    console.log(`[Cron Retries] Cron process-retries job completed. Total processed: ${duePayments.length}`);

    return NextResponse.json({
      success: true,
      processed: duePayments.length,
      results,
    });
  } catch (err: any) {
    console.error('[Cron Retries] Unexpected error executing cron job:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
