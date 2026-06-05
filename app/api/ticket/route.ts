import { NextRequest, NextResponse } from 'next/server';
import { generateTicketPDF } from '@/lib/pdf';
import { getPdf, storePdf } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      bookingId, name, email, phone, organization, designation,
      registrationType, totalAmount, utrNumber, eventDate, eventVenue,
    } = body;

    if (!bookingId || !name || !registrationType) {
      return NextResponse.json({ error: 'Missing ticket data.' }, { status: 400 });
    }

    // Try DB first — instant for tickets generated at registration time
    let pdfBuffer = await getPdf(bookingId);

    if (!pdfBuffer) {
      // Fallback: generate on the fly (covers old registrations + invite codes)
      pdfBuffer = await generateTicketPDF({
        bookingId,
        name,
        email,
        phone,
        organization: organization || '—',
        designation:  designation  || '—',
        registrationType,
        totalAmount:  Number(totalAmount),
        utrNumber:    utrNumber || '—',
        eventName:    'Prakriti 2026',
        eventSubtitle: 'Architects for a Sustainable Tomorrow',
        eventDate:    eventDate  || 'Saturday, 20 June 2026 · 3:00 PM',
        eventVenue:   eventVenue || 'Saffron Hall, Vardaan Grand — Sector-21C, GymKhana Club, Surajkund Road, Faridabad',
        organizer:    'The Indian Institute of Architects — Faridabad Centre',
      });
      // Cache it so the next download is instant
      storePdf(bookingId, pdfBuffer).catch(err => console.error('[pdf:store:ondemand]', err));
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="prakriti2026-ticket-${bookingId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('[ticket]', error);
    return NextResponse.json({ error: 'PDF generation failed.' }, { status: 500 });
  }
}
