import { NextRequest, NextResponse } from 'next/server';
import { getDb, initSchema, storePdf } from '@/lib/db';
import { isValidSession, SESSION_COOKIE } from '@/lib/auth';
import { generateTicketPDF, TicketData } from '@/lib/pdf';
import { sendTicketEmail } from '@/lib/mailer';

export const runtime = 'nodejs';

const ARCHITECT_TYPES = ["Architect - IIA Member", "Architect - Non-IIA Member"];

// Returns all registrations where the name already starts with AR./Ar./ar. and reg type is Architect
export async function GET(request: NextRequest) {
  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  if (!isValidSession(cookie)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await initSchema();
  const sql = getDb();

  const rows = await sql`
    SELECT booking_id, name, email, phone, organization, designation,
           registration_type, amount, utr_number, registered_at
    FROM registrations
    WHERE registration_type = ANY(${ARCHITECT_TYPES})
      AND (
        LOWER(name) LIKE 'ar. %'
        OR LOWER(name) LIKE 'ar.%'
        OR LOWER(name) LIKE 'ar %'
      )
    ORDER BY registered_at DESC
  `;

  return NextResponse.json({ affected: rows });
}

// Regenerate PDF + optionally resend email for given booking IDs
export async function POST(request: NextRequest) {
  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  if (!isValidSession(cookie)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { bookingIds, sendEmail } = await request.json() as {
    bookingIds: string[];
    sendEmail: boolean;
  };

  if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
    return NextResponse.json({ error: 'bookingIds array is required' }, { status: 400 });
  }

  await initSchema();
  const sql = getDb();

  const eventFields = {
    eventName:     process.env.EVENT_NAME     || 'Prakriti 2026',
    eventSubtitle: process.env.EVENT_SUBTITLE || 'Architects for a Sustainable Tomorrow',
    eventDate:     process.env.EVENT_DATE     || 'Saturday, 20 June 2026 · 3:00 PM',
    eventVenue:    process.env.EVENT_VENUE    || 'Saffron Hall, Vardaan Grand — Sector-21C, GymKhana Club, Surajkund Road, Faridabad',
    organizer:     process.env.ORGANIZER      || 'The Indian Institute of Architects — Faridabad Centre',
  };

  const results: { bookingId: string; status: 'ok' | 'error'; message: string }[] = [];

  for (const bookingId of bookingIds) {
    try {
      const rows = await sql`
        SELECT * FROM registrations WHERE booking_id = ${bookingId} LIMIT 1
      `;
      if (rows.length === 0) {
        results.push({ bookingId, status: 'error', message: 'Not found' });
        continue;
      }

      const row = rows[0];
      const ticketData: TicketData = {
        bookingId,
        name:             row.name           as string,
        email:            row.email          as string,
        phone:            row.phone          as string,
        organization:     (row.organization  as string) || '—',
        designation:      (row.designation   as string) || '—',
        registrationType: row.registration_type as string,
        totalAmount:      Number(row.amount),
        utrNumber:        (row.utr_number    as string) || '',
        ...eventFields,
      };

      // Regenerate PDF — the fixed pdf.ts will not double-prefix "AR."
      const pdfBuffer = await generateTicketPDF(ticketData);

      // Overwrite stored PDF
      await storePdf(bookingId, pdfBuffer);

      // Optionally resend ticket email
      if (sendEmail) {
        await sendTicketEmail(ticketData, true, [], pdfBuffer);
      }

      results.push({ bookingId, status: 'ok', message: sendEmail ? 'PDF fixed & email sent' : 'PDF fixed' });
    } catch (err) {
      results.push({
        bookingId,
        status: 'error',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return NextResponse.json({ results });
}
