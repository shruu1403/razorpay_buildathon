import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST() {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error('[Create Test Order] Missing Razorpay Key ID or Secret in environment');
      return NextResponse.json(
        { error: 'Razorpay credentials not configured in environment' },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const options = {
      amount: 49900, // ₹499 in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    console.log('[Create Test Order] Creating order with amount ₹499...');
    const order = await razorpay.orders.create(options);
    console.log('[Create Test Order] Order created successfully! ID:', order.id);

    return NextResponse.json({
      order_id: order.id,
      key_id: keyId,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error: any) {
    console.error('[Create Test Order] Error creating Razorpay order:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}
