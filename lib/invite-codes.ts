import { randomBytes } from 'crypto';
import { getDb } from './db';

async function initTable() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS invite_codes (
      code        TEXT PRIMARY KEY,
      description TEXT NOT NULL DEFAULT '',
      used        BOOLEAN NOT NULL DEFAULT FALSE,
      used_by     TEXT NOT NULL DEFAULT '',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export async function isInviteCodeValid(code: string): Promise<boolean> {
  await initTable();
  const sql = getDb();
  const rows = await sql`
    SELECT 1 FROM invite_codes
    WHERE code = ${code.trim().toUpperCase()} AND used = FALSE
    LIMIT 1
  `;
  return rows.length > 0;
}

export async function consumeInviteCode(code: string, bookingId: string): Promise<boolean> {
  await initTable();
  const sql = getDb();
  const result = await sql`
    UPDATE invite_codes
    SET used = TRUE, used_by = ${bookingId}
    WHERE code = ${code.trim().toUpperCase()} AND used = FALSE
    RETURNING code
  `;
  return result.length > 0;
}

export async function createInviteCode(description: string): Promise<string> {
  await initTable();
  const sql = getDb();
  // Cryptographically-random, unguessable code (10 hex chars = 40 bits).
  const code = `INV-${randomBytes(5).toString('hex').toUpperCase()}`;
  await sql`
    INSERT INTO invite_codes (code, description)
    VALUES (${code}, ${description})
    ON CONFLICT (code) DO NOTHING
  `;
  return code;
}

export interface InviteCode {
  code: string;
  description: string;
  used: boolean;
  usedBy: string;
  createdAt: string;
}

export async function listInviteCodes(): Promise<InviteCode[]> {
  await initTable();
  const sql = getDb();
  const rows = await sql`SELECT * FROM invite_codes ORDER BY created_at DESC`;
  return rows.map((r) => ({
    code:        r.code,
    description: r.description,
    used:        r.used,
    usedBy:      r.used_by,
    createdAt:   new Date(r.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
  }));
}
