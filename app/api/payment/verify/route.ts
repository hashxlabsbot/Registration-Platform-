import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { nanoid } from 'nanoid';
import { appendRegistration } from '@/lib/registrations';
import { sendTicketEmail, sendAdminNotification } from '@/lib/mailer';
import { generateTicketPDF, TicketData } from '@/lib/pdf';

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
      registrationType, coaNumber, iiaMembershipNumber,
      members,
    } = body;

    // ── Verify payment signature ──────────────────────────────────────────────
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Payment verification failed.' }, { status: 400 });
    }

    // ── Fetch order from Razorpay to get the authoritative amount ─────────────
    const razorpay = new Razorpay({
      key_id:     process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
    const order = await razorpay.orders.fetch(razorpay_order_id);
    const verifiedAmount = Number(order.amount) / 100; // paise → rupees

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
      totalAmount: verifiedAmount,
      utrNumber:   razorpay_payment_id,
      address:  address  || '',
      district: district || '',
      state:    state    || '',
      pincode:  pincode  || '',
      membersJson: JSON.stringify(Array.isArray(members) ? members : []),
    };

    await appendRegistration(rowData);

    // Send confirmation email + admin notification
    const eventFields = {
      eventName:     process.env.EVENT_NAME     || 'Prakriti 2026',
      eventSubtitle: process.env.EVENT_SUBTITLE || 'Architects for a Sustainable Tomorrow',
      eventDate:     process.env.EVENT_DATE     || 'Saturday, 20 June 2026 · 3:00 PM',
      eventVenue:    process.env.EVENT_VENUE    || 'Saffron Hall, Faridabad',
      organizer:     process.env.ORGANIZER      || 'The Indian Institute of Architects — Faridabad Centre',
    };

    const ticketData: TicketData = {
      bookingId,
      name,
      email,
      phone,
      organization:    firm        || '—',
      designation:     designation || '—',
      registrationType,
      totalAmount:     verifiedAmount,
      utrNumber:       razorpay_payment_id,
      ...eventFields,
    };

    const memberList: { name: string; relation: string; email: string; phone: string }[] =
      Array.isArray(members) ? members : [];

    const memberTickets: TicketData[] = memberList.map((m, i) => ({
      bookingId:        `${bookingId}-M${i + 1}`,
      name:             m.name,
      email:            m.email,
      phone:            m.phone,
      organization:     firm || '—',
      designation:      m.relation || 'Delegate',
      registrationType: 'Non-Architect',
      totalAmount:      1, // TODO: restore to 1000 after testing
      utrNumber:        razorpay_payment_id,
      ...eventFields,
    }));

    // Generate member PDFs to attach to the primary registrant's email
    const memberPdfs = await Promise.all(memberTickets.map(mt => generateTicketPDF(mt)));
    const memberAttachments = memberPdfs.map((pdf, i) => ({
      name:    `ticket-${memberTickets[i].bookingId}.pdf`,
      content: pdf.toString('base64'),
    }));

    let emailSent = true;
    await Promise.all([
      // Primary gets their ticket + all member tickets attached
      sendTicketEmail(ticketData, true, memberAttachments).catch(err => {
        console.error('[email:ticket]', err);
        emailSent = false;
      }),
      // Each member gets their own individual ticket email
      ...memberTickets.map(mt =>
        sendTicketEmail(mt, true).catch(err => console.error(`[email:member:${mt.bookingId}]`, err))
      ),
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
        members:             memberList,
      }).catch(err => console.error('[email:admin]', err)),
    ]);

    return NextResponse.json({
      success: true,
      bookingId,
      name,
      email,
      phone,
      organization:     firm        || '—',
      designation:      designation || '—',
      registrationType,
      totalAmount:      verifiedAmount,
      utrNumber:        razorpay_payment_id,
      emailSent,
    });
  } catch (error) {
    console.error('[verify]', error);
    return NextResponse.json({ error: 'Verification failed. Please contact support.' }, { status: 500 });
  }
}
