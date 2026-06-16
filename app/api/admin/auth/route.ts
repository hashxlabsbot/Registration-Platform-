import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, adminSessionToken, isAdminSecret } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  // Throttle login attempts to blunt password brute-forcing.
  if (!rateLimit(request, 'admin-auth', 10, 5 * 60_000)) {
    return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });
  }

  const { secret } = await request.json();

  if (!isAdminSecret(secret)) {
    return NextResponse.json({ error: 'Invalid password.' }, { status: 401 });
  }

  const adminSecret = (process.env.ADMIN_SECRET ?? '').trim();
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, adminSessionToken(adminSecret), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
