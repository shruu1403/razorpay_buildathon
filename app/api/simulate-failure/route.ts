import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { classifyFailure } from '@/lib/classify-failure';

/**
 * Realistic failure scenario definitions.
 * These mirror the actual error_code / error_reason / error_source / error_description
 * combinations Razorpay sends in production payment.failed webhooks.
 */
const FAILURE_SCENARIOS: Record<
  string,
  {
    error_code: string;
    error_reason: string;
    error_source: string;
    error_description: string;
  }
> = {
  insufficient_funds: {
    error_code: 'BAD_REQUEST_ERROR',
    error_reason: 'insufficient_balance',
    error_source: 'customer',
    error_description:
      'Your payment could not be completed due to insufficient account balance. Try using another payment method.',
  },
  card_expired: {
    error_code: 'BAD_REQUEST_ERROR',
    error_reason: 'card_expired',
    error_source: 'customer',
    error_description:
      'The card has expired. Please use a different card or update your card details.',
  },
  international_restricted: {
    error_code: 'BAD_REQUEST_ERROR',
    error_reason: 'international_transaction_not_allowed',
    error_source: 'business',
    error_description:
      'International transactions are not allowed on this payment method. Please contact the merchant.',
  },
  network_glitch: {
    error_code: 'GATEWAY_ERROR',
    error_reason: 'gateway_technical_error',
    error_source: 'gateway',
    error_description:
      'Payment processing failed due to a temporary error at the bank gateway. Please retry after some time.',
  },
  authentication_failed: {
    error_code: 'GATEWAY_ERROR',
    error_reason: 'authentication_failed',
    error_source: 'customer',
    error_description:
      'Payment was not authorised. Customer may have entered incorrect OTP or cancelled authentication.',
  },
  card_declined: {
    error_code: 'BAD_REQUEST_ERROR',
    error_reason: 'card_declined',
    error_source: 'gateway',
    error_description:
      'The card was declined by the issuing bank. Please use a different card or contact your bank.',
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      scenario,
      email = 'test.user@reviveai.demo',
      contact = '9876543210',
      amount = 49900,
    } = body;

    if (!scenario || !FAILURE_SCENARIOS[scenario]) {
      return NextResponse.json(
        {
          error: `Invalid scenario. Valid options: ${Object.keys(FAILURE_SCENARIOS).join(', ')}`,
        },
        { status: 400 }
      );
    }

    const scenarioData = FAILURE_SCENARIOS[scenario];

    // Classify using the real error fields
    const { category, retryStrategy, retryDelayHours } = classifyFailure(
      scenarioData.error_code,
      scenarioData.error_reason,
      scenarioData.error_source
    );

    const next_retry_at =
      retryDelayHours > 0
        ? new Date(Date.now() + retryDelayHours * 60 * 60 * 1000).toISOString()
        : null;

    const initialStatus = 'pending';

    // Generate a fake Razorpay-style payment/order ID for realism
    const fakePaymentId = `pay_sim${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const fakeOrderId = `order_sim${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

    const { data, error: dbError } = await supabaseAdmin
      .from('failed_payments')
      .insert([
        {
          razorpay_payment_id: fakePaymentId,
          razorpay_order_id: fakeOrderId,
          customer_email: email,
          customer_contact: contact,
          amount,
          currency: 'INR',
          error_code: scenarioData.error_code,
          error_description: scenarioData.error_description,
          error_reason: scenarioData.error_reason,
          error_source: scenarioData.error_source,
          failure_category: category,
          retry_strategy: retryStrategy,
          next_retry_at,
          status: initialStatus,
        },
      ])
      .select()
      .single();

    if (dbError || !data) {
      return NextResponse.json(
        { error: dbError?.message || 'Failed to insert simulated failure' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      id: data.id,
      scenario,
      classified_as: category,
      retry_strategy: retryStrategy,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
