import { NextRequest, NextResponse } from 'next/server';
import { generateTicketPDF } from '@/lib/pdf';

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

    const pdfBuffer = await generateTicketPDF({
      bookingId,
      name,
      email,
      phone,
      organization: organization || '—',
      designation: designation || '—',
      registrationType,
      totalAmount: Number(totalAmount),
      utrNumber: utrNumber || '—',
      eventName: 'Prakriti 2026',
      eventSubtitle: 'Architects for a Sustainable Tomorrow',
      eventDate: eventDate || 'Saturday, 20 June 2026 · 3:00 PM',
      eventVenue: eventVenue || 'Saffron Hall, Vardaan Grand, Faridabad',
      organizer: 'The Indian Institute of Architects — Faridabad Centre',
    });

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
