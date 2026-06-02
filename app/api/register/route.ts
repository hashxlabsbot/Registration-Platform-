import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { sendTicketEmail, sendAdminNotification } from '@/lib/mailer';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name, email, phone, whatsapp, gender, nationality,
      firm, designation, address, district, state, pincode,
      registrationType, coaNumber, iiaMembershipNumber, totalAmount,
    } = body;

    if (!name || !email || !phone || !registrationType) {
      return NextResponse.json({ error: 'Required fields are missing.' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }

    const bookingId = `PK-${nanoid(8).toUpperCase()}`;

    const ticketData = {
      bookingId,
      name,
      email,
      phone,
      organization: firm || '—',
      designation: designation || '—',
      eventName: process.env.EVENT_NAME!,
      eventSubtitle: process.env.EVENT_SUBTITLE!,
      eventDate: process.env.EVENT_DATE!,
      eventVenue: process.env.EVENT_VENUE!,
      organizer: process.env.ORGANIZER!,
      registrationType,
      totalAmount: Number(totalAmount),
    };

    await Promise.all([
      sendTicketEmail(ticketData),
      sendAdminNotification({
        ...ticketData,
        gender: gender || '—',
        nationality: nationality || '—',
        whatsapp: whatsapp || '—',
        address: address || '—',
        district: district || '—',
        state: state || '—',
        pincode: pincode || '—',
        coaNumber: coaNumber || '—',
        iiaMembershipNumber: iiaMembershipNumber || '—',
      }),
    ]);

    return NextResponse.json({ success: true, bookingId });
  } catch (error) {
    console.error('[register]', error);
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
