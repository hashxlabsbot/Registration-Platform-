import { NextRequest, NextResponse } from 'next/server';
import { getDb, initSchema, storePdf } from '@/lib/db';
import { isValidSession, SESSION_COOKIE } from '@/lib/auth';
import { generateTicketPDF, TicketData } from '@/lib/pdf';
import { sendTicketEmail } from '@/lib/mailer';

export const runtime = 'nodejs';
// Give enough time to regenerate many tickets
export const maxDuration = 300;

const EVENT_FIELDS = {
  eventName:     process.env.EVENT_NAME     || 'Prakriti 2026',
  eventSubtitle: process.env.EVENT_SUBTITLE || 'Architects for a Sustainable Tomorrow',
  eventDate:     process.env.EVENT_DATE     || 'Saturday, 20 June 2026 · 3:00 PM',
  eventVenue:    process.env.EVENT_VENUE    || 'Saffron Hall, Vardaan Grand — Sector-21C, GymKhana Club, Surajkund Road, Faridabad',
  organizer:     process.env.ORGANIZER      || 'The Indian Institute of Architects — Faridabad Centre',
};

// GET — returns total registration count so the UI can show what will be processed
export async function GET(request: NextRequest) {
  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  if (!isValidSession(cookie)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await initSchema();
  const sql = getDb();
  const rows = await sql`SELECT COUNT(*) AS cnt FROM registrations`;
  return NextResponse.json({ total: Number(rows[0].cnt) });
}

// POST — regenerate PDFs for all registrations (+ their members), optionally resend emails
export async function POST(request: NextRequest) {
  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  if (!isValidSession(cookie)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { sendEmail } = (await request.json()) as { sendEmail: boolean };

  await initSchema();
  const sql = getDb();

  const rows = await sql`
    SELECT booking_id, name, email, phone, organization, designation,
           registration_type, amount, utr_number, members_json
    FROM registrations
    ORDER BY registered_at ASC
  `;

  const results: { bookingId: string; status: 'ok' | 'error'; message: string }[] = [];

  for (const row of rows) {
    const bookingId      = row.booking_id as string;
    const membersRaw     = row.members_json as string;
    let members: { name: string; relation: string; email: string; phone: string }[] = [];
    try { members = JSON.parse(membersRaw || '[]'); } catch { members = []; }

    try {
      // ── Primary ticket ────────────────────────────────────────────────────────
      const primary: TicketData = {
        bookingId,
        name:             row.name             as string,
        email:            row.email            as string,
        phone:            row.phone            as string,
        organization:     (row.organization    as string) || '—',
        designation:      (row.designation     as string) || '—',
        registrationType: row.registration_type as string,
        totalAmount:      Number(row.amount),
        utrNumber:        (row.utr_number       as string) || '',
        ...EVENT_FIELDS,
      };

      const primaryPdf = await generateTicketPDF(primary);
      await storePdf(bookingId, primaryPdf);

      // ── Member tickets ────────────────────────────────────────────────────────
      const memberTickets: TicketData[] = members.map((m, i) => ({
        bookingId:        `${bookingId}-M${i + 1}`,
        name:             m.name,
        email:            m.email,
        phone:            m.phone,
        organization:     (row.organization as string) || '—',
        designation:      m.relation || 'Delegate',
        registrationType: 'Non-Architect',
        totalAmount:      1000,
        utrNumber:        (row.utr_number as string) || '',
        ...EVENT_FIELDS,
      }));

      const memberPdfs = await Promise.all(memberTickets.map(mt => generateTicketPDF(mt)));
      await Promise.all(memberPdfs.map((pdf, i) => storePdf(memberTickets[i].bookingId, pdf)));

      // ── Optional email resend ─────────────────────────────────────────────────
      if (sendEmail) {
        const memberAttachments = memberPdfs.map((pdf, i) => ({
          name:    `ticket-${memberTickets[i].bookingId}.pdf`,
          content: pdf.toString('base64'),
        }));
        await sendTicketEmail(primary, true, memberAttachments, primaryPdf).catch(() => {});
        await Promise.all(
          memberTickets.map((mt, i) =>
            sendTicketEmail(mt, true, [], memberPdfs[i]).catch(() => {})
          )
        );
      }

      results.push({ bookingId, status: 'ok', message: sendEmail ? 'PDF fixed & email sent' : 'PDF fixed' });
    } catch (err) {
      results.push({
        bookingId,
        status:  'error',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return NextResponse.json({
    total:    results.length,
    fixed:    results.filter(r => r.status === 'ok').length,
    failed:   results.filter(r => r.status === 'error').length,
    results,
  });
}
