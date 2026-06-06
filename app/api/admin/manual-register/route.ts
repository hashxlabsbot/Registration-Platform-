import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { appendRegistration } from '@/lib/registrations';
import { sendTicketEmail, sendAdminNotification } from '@/lib/mailer';
import { generateTicketPDF, TicketData } from '@/lib/pdf';
import { storePdf } from '@/lib/db';

export const runtime = 'nodejs';

// ONE-TIME rescue endpoint — delete this file after use.
export async function POST(request: NextRequest) {
  const adminSecret = (process.env.ADMIN_SECRET ?? '').trim();
  const body = await request.json();

  if (!adminSecret || (body.adminSecret ?? '').trim() !== adminSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const {
    name, email, phone,
    whatsapp = '', gender = '', nationality = '',
    organization = '', designation = '',
    coaNumber = '', iiaMembershipNumber = '',
    registrationType,
    totalAmount,
    razorpayPaymentId,
    address = '', district = '', state = '', pincode = '',
    members = [],
  } = body;

  if (!name || !email || !phone || !registrationType || !razorpayPaymentId) {
    return NextResponse.json(
      { error: 'Required: name, email, phone, registrationType, razorpayPaymentId' },
      { status: 400 },
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
    totalAmount: Number(totalAmount),
    utrNumber: razorpayPaymentId,
    address, district, state, pincode,
    membersJson: JSON.stringify(Array.isArray(members) ? members : []),
  });

  const ticketData: TicketData = {
    bookingId, name, email, phone,
    organization: organization || '—',
    designation:  designation  || '—',
    registrationType,
    totalAmount: Number(totalAmount),
    utrNumber: razorpayPaymentId,
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

  const memberAttachments = memberPdfs.map((pdf, i) => ({
    name:    `ticket-${memberTickets[i].bookingId}.pdf`,
    content: pdf.toString('base64'),
  }));

  const errors: string[] = [];

  await Promise.all([
    sendTicketEmail(ticketData, true, memberAttachments, primaryPdf).catch(err => {
      errors.push(`ticket email: ${err.message}`);
    }),
    ...memberTickets.map((mt, i) =>
      sendTicketEmail(mt, true, [], memberPdfs[i]).catch(err =>
        errors.push(`member email ${mt.bookingId}: ${err.message}`),
      ),
    ),
    sendAdminNotification({
      ...ticketData,
      gender, nationality, whatsapp,
      address, district, state, pincode,
      coaNumber, iiaMembershipNumber,
      members: memberList,
    }).catch(err => errors.push(`admin notification: ${err.message}`)),
  ]);

  return NextResponse.json({
    success: true,
    bookingId,
    emailErrors: errors.length > 0 ? errors : null,
  });
}
