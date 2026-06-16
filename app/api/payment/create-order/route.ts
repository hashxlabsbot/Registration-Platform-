import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export const runtime = 'nodejs';

const REGISTRATION_DEADLINE = new Date('2026-06-17T23:59:59+05:30').getTime();

export async function POST(request: NextRequest) {
  if (Date.now() > REGISTRATION_DEADLINE) {
    return NextResponse.json(
      { error: 'Registrations are now closed.' },
      { status: 410 }
    );
  }

  try {
    const {
      amount, registrationType,
      name, email, phone,
      organization, designation,
      district, state, pincode,
      coaNumber, iiaMembershipNumber,
      membersCount,
    } = await request.json();

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
      notes: {
        attendee:            String(name             ?? '').slice(0, 256),
        email:               String(email            ?? '').slice(0, 256),
        phone:               String(phone            ?? '').slice(0, 20),
        organization:        String(organization     ?? '').slice(0, 256),
        designation:         String(designation      ?? '').slice(0, 256),
        district:            String(district         ?? '').slice(0, 100),
        state:               String(state            ?? '').slice(0, 100),
        pincode:             String(pincode          ?? '').slice(0, 10),
        coaNumber:           String(coaNumber        ?? '').slice(0, 100),
        iiaMembershipNumber: String(iiaMembershipNumber ?? '').slice(0, 100),
        registrationType:    String(registrationType ?? '').slice(0, 100),
        membersCount:        String(membersCount      ?? '0').slice(0, 5),
      },
    });

    return NextResponse.json({ orderId: order.id, amount: order.amount });
  } catch (err) {
    console.error('[create-order]', err);
    return NextResponse.json({ error: 'Could not create payment order. Please try again.' }, { status: 500 });
  }
}
