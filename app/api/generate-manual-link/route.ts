import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { generateRecoveryLinkForPayment } from '@/lib/generate-recovery-link';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, contact, amount, description } = body;

    if (!amount || typeof amount !== 'number') {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    // 1. Create a failed payment record in Supabase
    const { data: record, error: dbError } = await supabaseAdmin
      .from('failed_payments')
      .insert([
        {
          customer_email: email || null,
          customer_contact: contact || null,
          amount: amount,
          currency: 'INR',
          error_code: 'MANUAL_DISPATCH',
          error_description: description || 'Manual payment recovery link dispatch',
          error_reason: 'Manual Merchant Action',
          failure_category: 'manual_dispatch',
          retry_strategy: 'manual_recovery',
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (dbError || !record) {
      return NextResponse.json(
        { error: dbError?.message || 'Failed to create record' },
        { status: 500 }
      );
    }

    // 2. Generate recovery payment link using Razorpay API
    const result = await generateRecoveryLinkForPayment(record.id);

    if (!result.success || !result.recovery_link) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate Razorpay recovery link' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      failed_payment_id: record.id,
      recovery_link: result.recovery_link,
      recovery_payment_link_id: result.recovery_payment_link_id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
