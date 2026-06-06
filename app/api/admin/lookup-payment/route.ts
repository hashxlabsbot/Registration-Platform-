import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { isValidSession, SESSION_COOKIE } from '@/lib/auth';
import { getRegistrationById } from '@/lib/registrations';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  if (!isValidSession(cookie)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { paymentId } = await request.json();
  if (!paymentId || typeof paymentId !== 'string') {
    return NextResponse.json({ error: 'paymentId is required' }, { status: 400 });
  }

  const razorpay = new Razorpay({
    key_id:     process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let payment: any;
  try {
    payment = await razorpay.payments.fetch(paymentId);
  } catch {
    return NextResponse.json({ error: 'Payment not found in Razorpay. Check the payment ID.' }, { status: 404 });
  }

  if (payment.status !== 'captured') {
    return NextResponse.json(
      { error: `Payment status is "${payment.status}" — only captured payments can be recovered.` },
      { status: 400 },
    );
  }

  // Fetch the associated order for notes (registrationType, name)
  let orderNotes: Record<string, string> = {};
  if (payment.order_id) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const order: any = await razorpay.orders.fetch(payment.order_id as string);
      orderNotes = (order.notes as Record<string, string>) ?? {};
    } catch { /* non-fatal */ }
  }

  const amount = Number(payment.amount) / 100;

  // Parse phone: Razorpay stores as "+91XXXXXXXXXX"
  const contact = String(payment.contact ?? '');
  const phone   = contact.startsWith('+91') ? contact.slice(3) : contact;

  return NextResponse.json({
    paymentId,
    status:           payment.status,
    amount,
    email:            payment.email            ?? '',
    phone,
    name:             orderNotes.attendee      ?? '',
    registrationType: orderNotes.registrationType ?? '',
    orderId:          payment.order_id         ?? '',
  });
}
