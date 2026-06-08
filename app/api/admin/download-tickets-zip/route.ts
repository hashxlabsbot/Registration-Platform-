import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { getDb, initSchema } from '@/lib/db';
import { isValidSession, SESSION_COOKIE } from '@/lib/auth';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  if (!isValidSession(cookie)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await initSchema();
  const sql = getDb();

  // Join ticket_pdfs with registrations to get the attendee name for each PDF filename
  const rows = await sql`
    SELECT
      tp.booking_id,
      tp.pdf_b64,
      COALESCE(r.name, '') AS name,
      COALESCE(r.registration_type, '') AS reg_type
    FROM ticket_pdfs tp
    LEFT JOIN registrations r ON r.booking_id = tp.booking_id
    ORDER BY tp.booking_id ASC
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: 'No tickets found.' }, { status: 404 });
  }

  const zip = new JSZip();
  const folder = zip.folder('Prakriti2026-Tickets')!;

  for (const row of rows) {
    const bookingId = row.booking_id as string;
    const pdfB64   = row.pdf_b64   as string;
    // Sanitise name for use in filename
    const rawName  = (row.name as string).replace(/[^a-zA-Z0-9\s.]/g, '').trim().replace(/\s+/g, '_');
    const filename = rawName ? `${bookingId}_${rawName}.pdf` : `${bookingId}.pdf`;
    folder.file(filename, Buffer.from(pdfB64, 'base64'));
  }

  const zipBuffer = await zip.generateAsync({
    type:               'nodebuffer',
    compression:        'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      'Content-Type':        'application/zip',
      'Content-Disposition': `attachment; filename="Prakriti2026-Tickets-${rows.length}-${date}.zip"`,
    },
  });
}
