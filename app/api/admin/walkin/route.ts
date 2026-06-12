import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { appendRegistration, checkInRegistration } from '@/lib/registrations';
import { sendTicketEmail } from '@/lib/mailer';
import { generateTicketPDF, TicketData } from '@/lib/pdf';
import { storePdf } from '@/lib/db';
import { isValidSession, SESSION_COOKIE } from '@/lib/auth';

export const runtime = 'nodejs';

// On-spot walk-in registration. Creates a booking, checks it in immediately,
// and returns the QR payload so the desk can show it on screen — no email wait.
export async function POST(request: NextRequest) {
  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  if (!isValidSession(cookie)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const {
    name, email, phone,
    organization = '', designation = '',
    registrationType = 'Delegate',
    totalAmount = 0,
    sendEmail = false,
  } = await request.json();

  if (!name || !phone) {
    return NextResponse.json({ error: 'Name and phone are required.' }, { status: 400 });
  }

  const bookingId = `PK-${nanoid(8).toUpperCase()}`;
  const amount = Number(totalAmount) || 0;
  const safeEmail = (email || '').trim();

  const eventFields = {
    eventName:     process.env.EVENT_NAME     || 'Prakriti 2026',
    eventSubtitle: process.env.EVENT_SUBTITLE || 'Architects for a Sustainable Tomorrow',
    eventDate:     process.env.EVENT_DATE     || 'Saturday, 20 June 2026 · 3:00 PM',
    eventVenue:    process.env.EVENT_VENUE    || 'Saffron Hall, Vardaan Grand — Sector-21C, GymKhana Club, Surajkund Road, Faridabad',
    organizer:     process.env.ORGANIZER      || 'The Indian Institute of Architects — Faridabad Centre',
  };

  await appendRegistration({
    bookingId, name, email: safeEmail, phone,
    whatsapp: '', gender: '', nationality: '',
    organization, designation,
    coaNumber: '', iiaMembershipNumber: '',
    registrationType,
    totalAmount: amount,
    utrNumber: 'WALK-IN',
    address: '', district: '', state: '', pincode: '',
    membersJson: '[]',
  });

  // Mark present right away — they're standing at the desk.
  await checkInRegistration(bookingId);

  const ticketData: TicketData = {
    bookingId, name, email: safeEmail, phone,
    organization: organization || '—',
    designation:  designation  || '—',
    registrationType,
    totalAmount: amount,
    utrNumber: 'WALK-IN',
    ...eventFields,
  };

  // Generate + cache the PDF so it can be downloaded later from the ticket route.
  try {
    const pdf = await generateTicketPDF(ticketData);
    await storePdf(bookingId, pdf).catch((err) => console.error('[walkin:pdf]', err));
    if (sendEmail && safeEmail) {
      sendTicketEmail(ticketData, true, [], pdf).catch((err) => console.error('[walkin:email]', err));
    }
  } catch (err) {
    console.error('[walkin:ticket]', err);
  }

  // QR payload mirrors lib/pdf.ts so on-screen QR scans identically.
  const qr = {
    id:   bookingId,
    name,
    type: registrationType,
    amt:  `Rs.${amount}`,
    ph:   phone,
    em:   safeEmail,
    ev:   'PRAKRITI2026',
    dt:   '20-06-2026',
  };

  return NextResponse.json({ success: true, bookingId, qr });
}
