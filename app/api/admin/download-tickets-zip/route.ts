import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { getDb, initSchema } from '@/lib/db';
import { isValidSession, SESSION_COOKIE } from '@/lib/auth';

export const runtime = 'nodejs';
export const maxDuration = 300;

// How many ticket PDFs to pull from the DB per round trip. Each ticket PDF
// embeds the full-page background image (~1.4 MB), so fetching every blob in a
// single query buffers the entire (tens/hundreds of MB) response in memory and
// reliably OOMs the function. Chunking keeps peak memory bounded.
const FETCH_CHUNK = 20;

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  if (!isValidSession(cookie)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await initSchema();
  const sql = getDb();

  // 1. Pull the list of tickets (no PDF blobs) so we know what to fetch.
  const list = await sql`
    SELECT
      tp.booking_id,
      COALESCE(r.name, '') AS name
    FROM ticket_pdfs tp
    LEFT JOIN registrations r ON r.booking_id = tp.booking_id
    ORDER BY tp.booking_id ASC
  `;

  if (list.length === 0) {
    return NextResponse.json({ error: 'No tickets found.' }, { status: 404 });
  }

  const zip = new JSZip();
  const folder = zip.folder('Prakriti2026-Tickets')!;
  const nameById = new Map(list.map((r) => [r.booking_id as string, r.name as string]));

  // 2. Fetch the PDF blobs in chunks and add them to the archive. PDFs are
  //    already compressed (they embed a PNG), so STORE avoids wasting CPU and
  //    memory on a DEFLATE pass that buys nothing.
  for (let i = 0; i < list.length; i += FETCH_CHUNK) {
    const ids = list.slice(i, i + FETCH_CHUNK).map((r) => r.booking_id as string);
    const blobs = await sql`
      SELECT booking_id, pdf_b64 FROM ticket_pdfs WHERE booking_id = ANY(${ids}::text[])
    `;

    for (const row of blobs) {
      const bookingId = row.booking_id as string;
      const pdfB64 = row.pdf_b64 as string;
      const rawName = (nameById.get(bookingId) ?? '')
        .replace(/[^a-zA-Z0-9\s.]/g, '')
        .trim()
        .replace(/\s+/g, '_');
      const filename = rawName ? `${bookingId}_${rawName}.pdf` : `${bookingId}.pdf`;
      folder.file(filename, Buffer.from(pdfB64, 'base64'), { compression: 'STORE' });
    }
  }

  // 3. Stream the archive to the client instead of buffering the whole zip
  //    (plus a second Uint8Array copy) in memory.
  const helper = zip.generateInternalStream({
    type: 'uint8array',
    streamFiles: true,
    compression: 'STORE',
  });

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      helper
        .on('data', (chunk: Uint8Array) => {
          controller.enqueue(chunk);
          if ((controller.desiredSize ?? 1) <= 0) helper.pause();
        })
        .on('error', (err: Error) => controller.error(err))
        .on('end', () => controller.close())
        .resume();
    },
    pull() {
      helper.resume();
    },
    cancel() {
      helper.pause();
    },
  });

  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="Prakriti2026-Tickets-${list.length}-${date}.zip"`,
    },
  });
}
