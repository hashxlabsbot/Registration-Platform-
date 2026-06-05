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
}
