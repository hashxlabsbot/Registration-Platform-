import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { nanoid } from 'nanoid';
import { appendRegistration } from '@/lib/registrations';
import { sendTicketEmail, sendAdminNotification } from '@/lib/mailer';
import { generateTicketPDF, TicketData } from '@/lib/pdf';
import { storePdf, getDb, initSchema } from '@/lib/db';
import { isValidSession, SESSION_COOKIE } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  if (!isValidSession(cookie)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const {
    razorpayPaymentId,
    name, email, phone,
    whatsapp = '', gender = '', nationality = '',
    organization = '', designation = '',
    coaNumber = '', iiaMembershipNumber = '',
    registrationType,
    totalAmount,
    address = '', district = '', state = '', pincode = '',
    members = [],
    sendEmail = true,
  } = body;

  if (!name || !email || !phone || !registrationType || !razorpayPaymentId) {
    return NextResponse.json(
      { error: 'Required: razorpayPaymentId, name, email, phone, registrationType' },
      { status: 400 },
    );
  }

  // Verify the payment is genuinely captured before creating a registration
  const razorpay = new Razorpay({
    key_id:     process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

  let verifiedAmount = Number(totalAmount);
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payment: any = await razorpay.payments.fetch(razorpayPaymentId);
    if (payment.status !== 'captured') {
      return NextResponse.json(
        { error: `Payment is not captured (status: ${payment.status}). Cannot register.` },
        { status: 400 },
      );
    }
    verifiedAmount = Number(payment.amount) / 100;
  } catch {
    return NextResponse.json(
      { error: 'Could not verify payment with Razorpay. Check the payment ID.' },
      { status: 400 },
    );
  }

  // Check for duplicate UTR
  await initSchema();
  const sql = getDb();
  const existing = await sql`
    SELECT booking_id FROM registrations WHERE utr_number = ${razorpayPaymentId} LIMIT 1
  `;
  if (existing.length > 0) {
    return NextResponse.json(
      { error: `A registration already exists for this payment (Booking ID: ${existing[0].booking_id}).` },
      { status: 409 },
    );
  }

  const bookingId = `PK-${nanoid(8).toUpperCase()}`;

  const eventFields = {
    eventName:     process.env.EVENT_NAME     || 'Prakriti 2026',
    eventSubtitle: process.env.EVENT_SUBTITLE || 'Architects for a Sustainable Tomorrow',
    eventDate:     process.env.EVENT_DATE     || 'Saturday, 20 June 2026 · 3:00 PM',
    eventVenue:    process.env.EVENT_VENUE    || 'Saffron Hall, Vardaan Grand — Sector-21C, GymKhana Club, Surajkund Road, Faridabad',
    organizer:     process.env.ORGANIZER      || 'The Indian Institute of Architects — Faridabad Centre',
  };

  await appendRegistration({
    bookingId, name, email, phone,
    whatsapp, gender, nationality,
    organization, designation,
    coaNumber, iiaMembershipNumber,
    registrationType,
    totalAmount: verifiedAmount,
    utrNumber:   razorpayPaymentId,
    address, district, state, pincode,
    membersJson: JSON.stringify(Array.isArray(members) ? members : []),
  });

  const ticketData: TicketData = {
    bookingId, name, email, phone,
    organization: organization || '—',
    designation:  designation  || '—',
    registrationType,
    totalAmount: verifiedAmount,
    utrNumber:   razorpayPaymentId,
    ...eventFields,
  };

  const memberList: { name: string; relation: string; email: string; phone: string }[] =
    Array.isArray(members) ? members : [];

  const memberTickets: TicketData[] = memberList.map((m, i) => ({
    bookingId:        `${bookingId}-M${i + 1}`,
    name:             m.name,
    email:            m.email,
    phone:            m.phone,
    organization:     organization || '—',
    designation:      m.relation || 'Delegate',
    registrationType: 'Non-Architect',
    totalAmount:      1000,
    utrNumber:        razorpayPaymentId,
    ...eventFields,
  }));

  const primaryPdf = await generateTicketPDF(ticketData);
  const memberPdfs = await Promise.all(memberTickets.map(mt => generateTicketPDF(mt)));

  await Promise.all([
    storePdf(bookingId, primaryPdf).catch(err => console.error('[pdf:store:primary]', err)),
    ...memberPdfs.map((pdf, i) =>
      storePdf(memberTickets[i].bookingId, pdf).catch(err =>
        console.error(`[pdf:store:${memberTickets[i].bookingId}]`, err),
      ),
    ),
  ]);

  const emailErrors: string[] = [];

  if (sendEmail) {
    const memberAttachments = memberPdfs.map((pdf, i) => ({
      name:    `ticket-${memberTickets[i].bookingId}.pdf`,
      content: pdf.toString('base64'),
    }));

    await Promise.all([
      sendTicketEmail(ticketData, true, memberAttachments, primaryPdf).catch(err => {
        emailErrors.push(`primary ticket: ${err.message}`);
      }),
      ...memberTickets.map((mt, i) =>
        sendTicketEmail(mt, true, [], memberPdfs[i]).catch(err =>
          emailErrors.push(`member ${mt.bookingId}: ${err.message}`),
        ),
      ),
      sendAdminNotification({
        ...ticketData,
        gender, nationality, whatsapp,
        address, district, state, pincode,
        coaNumber, iiaMembershipNumber,
        members: memberList,
      }).catch(err => emailErrors.push(`admin notification: ${err.message}`)),
    ]);
  }

  return NextResponse.json({
    success: true,
    bookingId,
    verifiedAmount,
    emailErrors: emailErrors.length > 0 ? emailErrors : null,
  });
}
