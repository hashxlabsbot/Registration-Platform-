import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { nanoid } from 'nanoid';
import { appendRegistration } from '@/lib/registrations';
import { sendTicketEmail, sendAdminNotification } from '@/lib/mailer';

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

    await appendRegistration(rowData);

    // Send confirmation email + admin notification (fire-and-forget)
    const ticketData = {
      bookingId,
      name,
      email,
      phone,
      organization:    firm        || '—',
      designation:     designation || '—',
      registrationType,
      totalAmount:     Number(totalAmount),
      utrNumber:       razorpay_payment_id,
      eventName:       process.env.EVENT_NAME     || 'Prakriti 2026',
      eventSubtitle:   process.env.EVENT_SUBTITLE || 'Architects for a Sustainable Tomorrow',
      eventDate:       process.env.EVENT_DATE     || 'Saturday, 20 June 2026 · 3:00 PM',
      eventVenue:      process.env.EVENT_VENUE    || 'Saffron Hall, Faridabad',
      organizer:       process.env.ORGANIZER      || 'The Indian Institute of Architects — Faridabad Centre',
    };
    Promise.all([
      sendTicketEmail(ticketData, true),
      sendAdminNotification({
        ...ticketData,
        gender:              gender              || '',
        nationality:         nationality         || '',
        whatsapp:            whatsapp            || '',
        address:             address             || '',
        district:            district            || '',
        state:               state               || '',
        pincode:             pincode             || '',
        coaNumber:           coaNumber           || '',
        iiaMembershipNumber: iiaMembershipNumber || '',
      }),
    ]).catch(err => console.error('[email]', err));

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
