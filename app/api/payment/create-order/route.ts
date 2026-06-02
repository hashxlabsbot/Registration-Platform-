import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const { amount, registrationType, name, email } = await request.json();

  if (!amount || !registrationType) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }

  const razorpay = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

  const order = await razorpay.orders.create({
    amount:   Math.round(Number(amount) * 100), // paise
    currency: 'INR',
    notes: {
      registrationType,
      attendee: name,
      email,
    },
  });

  return NextResponse.json({ orderId: order.id, amount: order.amount });
}
