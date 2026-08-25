import { NextRequest, NextResponse } from 'next/server';
import { generateRecoveryLinkForPayment } from '@/lib/generate-recovery-link';

export async function POST(request: NextRequest) {
  console.log('[Generate Recovery Link API] Incoming request received');

  try {
    const body = await request.json();
    const { failedPaymentId } = body;

    if (!failedPaymentId) {
      console.error('[Generate Recovery Link API] Error: Missing failedPaymentId in request body');
      return NextResponse.json(
        { error: 'Missing failedPaymentId in request body' },
        { status: 400 }
      );
    }

    const result = await generateRecoveryLinkForPayment(failedPaymentId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate recovery link' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      recovery_link: result.recovery_link,
      recovery_payment_link_id: result.recovery_payment_link_id,
      status: 'retry_scheduled',
    });
  } catch (err: any) {
    console.error('[Generate Recovery Link API] Unexpected error:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
