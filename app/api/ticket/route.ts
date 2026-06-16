import { NextRequest, NextResponse } from 'next/server';
import { generateTicketPDF } from '@/lib/pdf';
import { getPdf, storePdf } from '@/lib/db';
import { getRegistrationById } from '@/lib/registrations';
import { isValidSession, SESSION_COOKIE } from '@/lib/auth';
import { verifyStaffToken, STAFF_COOKIE } from '@/lib/staff-auth';

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

    // Authenticated admin/staff may fetch any ticket (admin panel, walk-in).
    const isStaffOrAdmin =
      isValidSession(request.cookies.get(SESSION_COOKIE)?.value) ||
      verifyStaffToken(request.cookies.get(STAFF_COOKIE)?.value) !== null;

    // Ownership check — if this booking exists, an unauthenticated caller must
    // prove they own it by supplying the matching email. Prevents enumerating
    // someone else's ticket (and its PII) by guessing a booking ID.
    if (!isStaffOrAdmin) {
      const reg = await getRegistrationById(bookingId);
      if (reg) {
        const provided = String(email ?? '').trim().toLowerCase();
        if (!provided || provided !== reg.email.trim().toLowerCase()) {
          return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
        }
      }
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
