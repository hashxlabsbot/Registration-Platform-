import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { nanoid } from 'nanoid';
import { appendRegistration } from '@/lib/sheet';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      // attendee fields
      name, email, phone, whatsapp, gender, nationality,
      firm, designation, address, district, state, pincode,
      registrationType, coaNumber, iiaMembershipNumber, totalAmount,
    } = body;

    // ── Verify payment signature ──────────────────────────────────────────────
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Payment verification failed.' }, { status: 400 });
    }

    // ── Payment verified — create booking ─────────────────────────────────────
    const bookingId = `PK-${nanoid(8).toUpperCase()}`;

    const rowData = {
      bookingId,
      name,
      email,
      phone,
      whatsapp:            whatsapp            || '',
      gender:              gender              || '',
      nationality:         nationality         || '',
      organization:        firm                || '',
      designation:         designation         || '',
      coaNumber:           coaNumber           || '',
      iiaMembershipNumber: iiaMembershipNumber || '',
      registrationType,
      totalAmount: Number(totalAmount),
      utrNumber:   razorpay_payment_id,         // Razorpay payment ID acts as transaction ref
      address:  address  || '',
      district: district || '',
      state:    state    || '',
      pincode:  pincode  || '',
    };

    try { appendRegistration(rowData); } catch (e) { console.error('[verify] sheet:', e); }

    return NextResponse.json({
      success: true,
      bookingId,
      name,
      email,
      phone,
      organization:     firm        || '—',
      designation:      designation || '—',
      registrationType,
      totalAmount:      Number(totalAmount),
      utrNumber:        razorpay_payment_id,
    });
  } catch (error) {
    console.error('[verify]', error);
    return NextResponse.json({ error: 'Verification failed. Please contact support.' }, { status: 500 });
  }
}
