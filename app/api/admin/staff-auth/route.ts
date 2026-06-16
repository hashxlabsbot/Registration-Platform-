import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, createStaffToken, STAFF_COOKIE } from '@/lib/staff-auth';
import { getDb, initSchema } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!rateLimit(request, 'staff-auth', 10, 5 * 60_000)) {
    return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });
  }

  const { username, password } = await request.json();
  if (!username || !password) {
    return NextResponse.json({ error: 'username and password required' }, { status: 400 });
  }

  await initSchema();
  const sql = getDb();
  const rows = await sql`
    SELECT id, username, password_hash, role FROM staff_accounts WHERE username = ${username.trim()} LIMIT 1
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const account = rows[0];
  if (!verifyPassword(password, account.password_hash as string)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = createStaffToken(account.username as string, account.role as string);
  const res = NextResponse.json({ ok: true, role: account.role });
  res.cookies.set(STAFF_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(STAFF_COOKIE, '', { maxAge: 0, path: '/' });
  return res;
}
