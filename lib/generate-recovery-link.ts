import Razorpay from 'razorpay';
import { supabaseAdmin } from '@/lib/supabase-admin';

export interface GenerateRecoveryLinkResult {
  success: boolean;
  recovery_link?: string;
  recovery_payment_link_id?: string;
  error?: string;
}

export async function generateRecoveryLinkForPayment(failedPaymentId: string): Promise<GenerateRecoveryLinkResult> {
  console.log(`[Generate Recovery Link Core] Processing payment record ID: "${failedPaymentId}"...`);

  // 1. Fetch the failed payment record from Supabase
  const { data: record, error: fetchError } = await supabaseAdmin
    .from('failed_payments')
    .select('*')
    .eq('id', failedPaymentId)
    .single();

  if (fetchError || !record) {
    console.error('[Generate Recovery Link Core] Error fetching record:', fetchError);
    return {
      success: false,
      error: fetchError?.message || 'Failed payment record not found',
    };
  }

  // 2. Check Razorpay credentials
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.error('[Generate Recovery Link Core] Error: Razorpay credentials not configured');
    return {
      success: false,
      error: 'Razorpay credentials not configured',
    };
  }

  // 3. Initialize Razorpay SDK and create Payment Link
  const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  const paymentLinkPayload = {
    amount: record.amount,
    currency: record.currency || 'INR',
    accept_partial: false,
    description: `Recovery payment for order ${record.razorpay_order_id || record.id}`,
    customer: {
      name: record.customer_email ? record.customer_email.split('@')[0] : 'Customer',
      email: record.customer_email || undefined,
      contact: record.customer_contact || undefined,
    },
    notify: {
      sms: !!record.customer_contact,
      email: !!record.customer_email,
    },
    reminder_enable: true,
    notes: {
      failed_payment_id: record.id,
      original_order_id: record.razorpay_order_id || '',
    },
  };

  console.log('[Generate Recovery Link Core] Creating Razorpay Payment Link...');
  const paymentLink: any = await razorpay.paymentLink.create(paymentLinkPayload);

  const recoveryLinkUrl = paymentLink?.short_url;
  const paymentLinkId = paymentLink?.id;

  if (!recoveryLinkUrl) {
    console.error('[Generate Recovery Link Core] Payment link created but short_url missing:', paymentLink);
    return {
      success: false,
      error: 'Failed to extract short_url from Razorpay payment link response',
    };
  }

  // 4. Update Supabase record
  const nowIso = new Date().toISOString();

  const { error: updateError } = await supabaseAdmin
    .from('failed_payments')
    .update({
      recovery_link: recoveryLinkUrl,
      recovery_payment_link_id: paymentLinkId,
      status: 'retry_scheduled',
      updated_at: nowIso,
    })
    .eq('id', failedPaymentId);

  if (updateError) {
    console.error('[Generate Recovery Link Core] Supabase update error:', updateError);
    return {
      success: false,
      error: updateError.message,
    };
  }

  console.log('[Generate Recovery Link Core] Recovery link generated successfully:', {
    recovery_link: recoveryLinkUrl,
    recovery_payment_link_id: paymentLinkId,
  });

  return {
    success: true,
    recovery_link: recoveryLinkUrl,
    recovery_payment_link_id: paymentLinkId,
  };
}
