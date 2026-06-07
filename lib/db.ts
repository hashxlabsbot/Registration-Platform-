import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

let _sql: NeonQueryFunction<false, false> | null = null;

export function getDb(): NeonQueryFunction<false, false> {
  if (!_sql) {
    const url =
      process.env.DATABASE_URL ||
      process.env.prakriti2026_DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.prakriti2026_POSTGRES_URL;
    if (!url) throw new Error('No database URL found. Set DATABASE_URL in Vercel environment variables.');
    _sql = neon(url);
  }
  return _sql;
}

export async function initSchema(): Promise<void> {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS registrations (
      booking_id            TEXT PRIMARY KEY,
      name                  TEXT NOT NULL,
      email                 TEXT NOT NULL,
      phone                 TEXT NOT NULL,
      whatsapp              TEXT NOT NULL DEFAULT '',
      gender                TEXT NOT NULL DEFAULT '',
      nationality           TEXT NOT NULL DEFAULT '',
      organization          TEXT NOT NULL DEFAULT '',
      designation           TEXT NOT NULL DEFAULT '',
      coa_number            TEXT NOT NULL DEFAULT '',
      iia_membership_number TEXT NOT NULL DEFAULT '',
      registration_type     TEXT NOT NULL,
      amount                NUMERIC(10,2) NOT NULL DEFAULT 0,
      utr_number            TEXT NOT NULL DEFAULT '',
      address               TEXT NOT NULL DEFAULT '',
      district              TEXT NOT NULL DEFAULT '',
      state                 TEXT NOT NULL DEFAULT '',
      pincode               TEXT NOT NULL DEFAULT '',
      registered_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      checked_in            BOOLEAN NOT NULL DEFAULT FALSE,
      checkin_time          TIMESTAMPTZ
    )
  `;
  await sql`
    ALTER TABLE registrations ADD COLUMN IF NOT EXISTS members_json TEXT NOT NULL DEFAULT '[]'
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS ticket_pdfs (
      booking_id TEXT PRIMARY KEY,
      pdf_b64    TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS staff_accounts (
      id            SERIAL PRIMARY KEY,
      username      TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'volunteer',
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

// Store a generated PDF (base64) keyed by booking ID.
// Uses upsert so re-running registration never breaks.
export async function storePdf(bookingId: string, pdfBuffer: Buffer): Promise<void> {
  const sql = getDb();
  await sql`
    INSERT INTO ticket_pdfs (booking_id, pdf_b64)
    VALUES (${bookingId}, ${pdfBuffer.toString('base64')})
    ON CONFLICT (booking_id) DO UPDATE SET pdf_b64 = EXCLUDED.pdf_b64
  `;
}

// Returns the stored PDF buffer, or null if not found.
export async function getPdf(bookingId: string): Promise<Buffer | null> {
  const sql = getDb();
  const rows = await sql`
    SELECT pdf_b64 FROM ticket_pdfs WHERE booking_id = ${bookingId}
  `;
  if (rows.length === 0) return null;
  return Buffer.from(rows[0].pdf_b64 as string, 'base64');
}
