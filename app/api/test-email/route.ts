import { NextRequest, NextResponse } from 'next/server';
import { sendTicketEmail } from '@/lib/mailer';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const to = request.nextUrl.searchParams.get('to') || process.env.GMAIL_USER!;

  try {
    await sendTicketEmail({
      bookingId:        'PK-TEST1234',
      name:             'Test Attendee',
      email:            to,
      phone:            '9876543210',
      organization:     'Test Org',
      designation:      'Test Role',
      registrationType: 'Architect - IIA Member',
      totalAmount:      1,
      utrNumber:        'TEST_UTR',
      eventName:        process.env.EVENT_NAME     || 'Prakriti 2026',
      eventSubtitle:    process.env.EVENT_SUBTITLE || 'Architects for a Sustainable Tomorrow',
      eventDate:        process.env.EVENT_DATE     || 'Saturday, 20 June 2026 · 3:00 PM',
      eventVenue:       process.env.EVENT_VENUE    || 'Saffron Hall, Faridabad',
      organizer:        process.env.ORGANIZER      || 'The Indian Institute of Architects — Faridabad Centre',
    }, true);

    return NextResponse.json({ success: true, sentTo: to });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
