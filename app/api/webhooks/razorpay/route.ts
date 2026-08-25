import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { classifyFailure } from '@/lib/classify-failure';

export async function POST(request: NextRequest) {
  console.log('[Razorpay Webhook] Incoming webhook request received');

  try {
    // 1. Read raw request body and x-razorpay-signature header
    const bodyText = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    console.log('[Razorpay Webhook] Step 1: Raw request body read successfully');
    console.log('[Razorpay Webhook] Step 1: Received x-razorpay-signature:', signature);

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
      console.error('[Razorpay Webhook] Error: RAZORPAY_WEBHOOK_SECRET is not configured in environment');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    if (!signature) {
      console.error('[Razorpay Webhook] Error: Missing x-razorpay-signature header');
      return NextResponse.json({ error: 'Missing signature header' }, { status: 400 });
    }

    // 2. Verify signature using Razorpay's webhook secret with HMAC SHA256
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(bodyText)
      .digest('hex');

    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    const isSignatureValid =
      sigBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(sigBuffer, expectedBuffer);

    if (!isSignatureValid) {
      console.error('[Razorpay Webhook] Step 2: Signature verification FAILED');
      console.error(`[Razorpay Webhook] Expected: ${expectedSignature}, Received: ${signature}`);
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    console.log('[Razorpay Webhook] Step 2: Signature verification PASSED');

    // 3. Parse JSON body & check event type
    const payload = JSON.parse(bodyText);
    const event = payload?.event;

    console.log(`[Razorpay Webhook] Step 3: Parsed event type -> "${event}"`);

    // --- Branch A: payment_link.paid event handling ---
    if (event === 'payment_link.paid') {
      const paymentLinkId = payload?.payload?.payment_link?.entity?.id;

      console.log('[Razorpay Webhook - payment_link.paid] Step 1: Extracted payment link ID:', paymentLinkId);

      if (!paymentLinkId) {
        console.error('[Razorpay Webhook - payment_link.paid] Error: Missing payment_link.entity.id in payload');
        return NextResponse.json({ received: true }, { status: 200 });
      }

      console.log(`[Razorpay Webhook - payment_link.paid] Step 2: Finding row in failed_payments matching recovery_payment_link_id = "${paymentLinkId}"...`);

      const nowIso = new Date().toISOString();

      const { data, error: dbError } = await supabaseAdmin
        .from('failed_payments')
        .update({
          status: 'recovered',
          updated_at: nowIso,
        })
        .eq('recovery_payment_link_id', paymentLinkId)
        .select();

      if (dbError) {
        console.error('[Razorpay Webhook - payment_link.paid] Step 3: Supabase update ERROR:', dbError);
        return NextResponse.json({ received: true, error: dbError.message }, { status: 200 });
      }

      console.log('[Razorpay Webhook - payment_link.paid] Step 3: Successfully updated status to "recovered":', data);
      console.log('[Razorpay Webhook - payment_link.paid] Returning 200 { received: true }');

      return NextResponse.json({ received: true }, { status: 200 });
    }

    // --- Branch B: payment.failed event handling ---
    if (event === 'payment.failed') {
      // 4. Extract fields from payload.payload.payment.entity
      const paymentEntity = payload?.payload?.payment?.entity;

      if (!paymentEntity) {
        console.error('[Razorpay Webhook] Step 4: Missing payment entity in payload');
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const {
        id: razorpay_payment_id,
        order_id: razorpay_order_id,
        email: customer_email,
        contact: customer_contact,
        amount,
        currency,
        error_code,
        error_description,
        error_reason,
        error_source,
      } = paymentEntity;

      console.log('[Razorpay Webhook] Step 4: Extracted payment details:', {
        razorpay_payment_id,
        razorpay_order_id,
        customer_email,
        customer_contact,
        amount,
        currency,
        error_code,
        error_description,
        error_reason,
        error_source,
      });

      // 4b. Classify failure and determine retry strategy & initial status
      const { category, retryStrategy, retryDelayHours } = classifyFailure(
        error_code || '',
        error_reason || ''
      );

      const next_retry_at =
        retryDelayHours > 0
          ? new Date(Date.now() + retryDelayHours * 60 * 60 * 1000).toISOString()
          : null;

      const initialStatus = retryStrategy.startsWith('auto_retry')
        ? 'retry_scheduled'
        : 'pending';

      console.log('[Razorpay Webhook] Step 4b: Classified failure:', {
        failure_category: category,
        retry_strategy: retryStrategy,
        retry_delay_hours: retryDelayHours,
        next_retry_at,
        status: initialStatus,
      });

      // 5. Insert into Supabase `failed_payments` table using service role client
      console.log('[Razorpay Webhook] Step 5: Inserting record into Supabase failed_payments table...');

      const { data, error: dbError } = await supabaseAdmin
        .from('failed_payments')
        .insert([
          {
            razorpay_payment_id,
            razorpay_order_id,
            customer_email,
            customer_contact,
            amount,
            currency,
            error_code,
            error_description,
            error_reason,
            error_source,
            failure_category: category,
            retry_strategy: retryStrategy,
            next_retry_at,
            status: initialStatus,
          },
        ])
        .select();

      if (dbError) {
        console.error('[Razorpay Webhook] Step 5: Supabase insertion ERROR:', dbError);
        // Return 200 on DB error to avoid Razorpay retries during testing
        return NextResponse.json({ received: true, error: dbError.message }, { status: 200 });
      }

      console.log('[Razorpay Webhook] Step 5: Saved to Supabase successfully:', data);
      console.log('[Razorpay Webhook] Step 6: Returning 200 { received: true }');

      return NextResponse.json({ received: true }, { status: 200 });
    }

    // --- Branch C: Unhandled Event ---
    console.log(`[Razorpay Webhook] Event "${event}" ignored. Only processing "payment.failed" and "payment_link.paid".`);
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err: any) {
    console.error('[Razorpay Webhook] Unexpected Error:', err);
    return NextResponse.json({ received: true, error: err?.message || 'Internal Error' }, { status: 200 });
  }
}
