import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(request: NextRequest) {
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

    // Read amount from request body — frontend sends amount in paise
    let amountPaise = 49900; // default ₹499
    try {
      const body = await request.json();
      if (body.amount && typeof body.amount === 'number' && body.amount > 0) {
        amountPaise = body.amount;
      }
    } catch {
      // If body parsing fails, use the default amount
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const options = {
      amount: amountPaise,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    console.log(`[Create Test Order] Creating order with amount ₹${amountPaise / 100}...`);
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
