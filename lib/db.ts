import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set.');
}

export const sql = neon(process.env.DATABASE_URL);

export async function initSchema(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS registrations (
      booking_id           TEXT PRIMARY KEY,
      name                 TEXT NOT NULL,
      email                TEXT NOT NULL,
      phone                TEXT NOT NULL,
      whatsapp             TEXT NOT NULL DEFAULT '',
      gender               TEXT NOT NULL DEFAULT '',
      nationality          TEXT NOT NULL DEFAULT '',
      organization         TEXT NOT NULL DEFAULT '',
      designation          TEXT NOT NULL DEFAULT '',
      coa_number           TEXT NOT NULL DEFAULT '',
      iia_membership_number TEXT NOT NULL DEFAULT '',
      registration_type    TEXT NOT NULL,
      amount               NUMERIC(10,2) NOT NULL DEFAULT 0,
      utr_number           TEXT NOT NULL DEFAULT '',
      address              TEXT NOT NULL DEFAULT '',
      district             TEXT NOT NULL DEFAULT '',
      state                TEXT NOT NULL DEFAULT '',
      pincode              TEXT NOT NULL DEFAULT '',
      registered_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      checked_in           BOOLEAN NOT NULL DEFAULT FALSE,
      checkin_time         TIMESTAMPTZ
    )
  `;
}
