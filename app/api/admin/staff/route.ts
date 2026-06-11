import { NextRequest, NextResponse } from 'next/server';
import { isValidSession, SESSION_COOKIE } from '@/lib/auth';
import { hashPassword } from '@/lib/staff-auth';
import { getDb, initSchema } from '@/lib/db';

export const runtime = 'nodejs';

function adminOnly(request: NextRequest) {
  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  return isValidSession(cookie);
}

export async function GET(request: NextRequest) {
  if (!adminOnly(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await initSchema();
  const sql = getDb();
  const rows = await sql`
    SELECT id, username, role, created_at FROM staff_accounts ORDER BY created_at DESC
  `;
  return NextResponse.json({ staff: rows });
}

export async function POST(request: NextRequest) {
  if (!adminOnly(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { username, password, role } = await request.json();
  if (!username || !password) return NextResponse.json({ error: 'username and password required' }, { status: 400 });
  const validRoles = ['volunteer', 'viewer'];
  if (role && !validRoles.includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });

  await initSchema();
  const sql = getDb();
  const hash = hashPassword(password);
  try {
    const rows = await sql`
      INSERT INTO staff_accounts (username, password_hash, role)
      VALUES (${username.trim()}, ${hash}, ${role ?? 'volunteer'})
      RETURNING id, username, role, created_at
    `;
    return NextResponse.json({ staff: rows[0] }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
    }
    throw e;
  }
}

export async function DELETE(request: NextRequest) {
  if (!adminOnly(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await initSchema();
  const sql = getDb();
  await sql`DELETE FROM staff_accounts WHERE id = ${Number(id)}`;
  return NextResponse.json({ ok: true });
}
