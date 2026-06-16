import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { nanoid } from 'nanoid';
import { appendRegistration, findRegistrationByUtr } from '@/lib/registrations';
import { sendTicketEmail, sendAdminNotification } from '@/lib/mailer';
import { generateTicketPDF, TicketData } from '@/lib/pdf';
import { storePdf } from '@/lib/db';
import { computeTotalAmount } from '@/lib/pricing';

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

    if (
      typeof razorpay_signature !== 'string' ||
      expectedSignature.length !== razorpay_signature.length ||
      !crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(razorpay_signature))
    ) {
      return NextResponse.json({ error: 'Payment verification failed.' }, { status: 400 });
    }

    // ── Idempotency — never double-register a single payment ──────────────────
    const existing = await findRegistrationByUtr(razorpay_payment_id);
    if (existing) {
      return NextResponse.json({
        success: true,
        bookingId:        existing.bookingId,
        name:             existing.name,
        email:            existing.email,
        phone:            existing.phone,
        organization:     existing.organization || '—',
        designation:      existing.designation  || '—',
        registrationType: existing.registrationType,
        totalAmount:      existing.amount,
        utrNumber:        existing.utrNumber,
        emailSent:        true,
      });
    }

    // ── Fetch order from Razorpay to get the authoritative amount ─────────────
    const razorpay = new Razorpay({
      key_id:     process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
    const order = await razorpay.orders.fetch(razorpay_order_id);
    const verifiedAmount = Number(order.amount) / 100; // paise → rupees

    // ── Re-validate the paid amount against our own price table ───────────────
    // Guards against an order created with a tampered amount.
    const memberCount = Array.isArray(members) ? members.length : 0;
    const expectedAmount = computeTotalAmount(registrationType, memberCount);
    if (expectedAmount === null || verifiedAmount !== expectedAmount) {
      console.error('[verify] amount mismatch', { registrationType, memberCount, verifiedAmount, expectedAmount });
      return NextResponse.json({ error: 'Payment amount does not match the registration. Please contact support.' }, { status: 400 });
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
      eventVenue:    process.env.EVENT_VENUE    || 'Saffron Hall, Vardaan Grand — Sector-21C, GymKhana Club, Surajkund Road, Faridabad',
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
      totalAmount:      1000,
      utrNumber:        razorpay_payment_id,
      ...eventFields,
    }));

    // Generate all PDFs once — primary + each member
    const primaryPdf  = await generateTicketPDF(ticketData);
    const memberPdfs  = await Promise.all(memberTickets.map(mt => generateTicketPDF(mt)));

    // Persist to DB (fire-and-forget errors — don't fail the registration)
    await Promise.all([
      storePdf(bookingId, primaryPdf).catch(err => console.error('[pdf:store:primary]', err)),
      ...memberPdfs.map((pdf, i) =>
        storePdf(memberTickets[i].bookingId, pdf).catch(err =>
          console.error(`[pdf:store:${memberTickets[i].bookingId}]`, err)
        )
      ),
    ]);

    const memberAttachments = memberPdfs.map((pdf, i) => ({
      name:    `ticket-${memberTickets[i].bookingId}.pdf`,
      content: pdf.toString('base64'),
    }));

    let emailSent = true;
    await Promise.all([
      // Pass pre-generated PDFs — no second generation needed
      sendTicketEmail(ticketData, true, memberAttachments, primaryPdf).catch(err => {
        console.error('[email:ticket]', err);
        emailSent = false;
      }),
      // Each member gets their own individual ticket email with their pre-generated PDF
      ...memberTickets.map((mt, i) =>
        sendTicketEmail(mt, true, [], memberPdfs[i]).catch(err => console.error(`[email:member:${mt.bookingId}]`, err))
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
