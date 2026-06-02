import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { amount, registrationType, name, email } = await request.json();

    if (!amount || !registrationType) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const keyId     = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error('[create-order] Razorpay keys not configured');
      return NextResponse.json({ error: 'Payment gateway not configured.' }, { status: 500 });
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await razorpay.orders.create({
      amount:   Math.round(Number(amount) * 100),
      currency: 'INR',
      notes:    { registrationType, attendee: name, email },
    });

    return NextResponse.json({ orderId: order.id, amount: order.amount });
  } catch (err) {
    console.error('[create-order]', err);
    return NextResponse.json({ error: 'Could not create payment order. Please try again.' }, { status: 500 });
  }
}
