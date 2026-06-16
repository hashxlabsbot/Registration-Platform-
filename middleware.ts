import { NextRequest, NextResponse } from 'next/server';

// Inline constants to avoid importing Node.js crypto modules in Edge Runtime
const SESSION_COOKIE = 'admin_session';
const STAFF_COOKIE   = 'staff_session';

const VOLUNTEER_ALLOWED_PREFIXES = ['/admin/scan', '/api/admin/checkin', '/api/admin/registrations'];
const VOLUNTEER_ALLOWED_EXACT    = ['/admin'];

// Edge-safe constant-time string compare.
function safeEqualEdge(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Edge-safe HMAC token derivation matching lib/auth.ts adminSessionToken().
async function adminSessionTokenEdge(secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode('admin-session-v1'));
  // base64url encode
  let bin = '';
  const bytes = new Uint8Array(sig);
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Edge-safe HMAC-SHA256 verification using Web Crypto API (no Node.js crypto)
async function verifyStaffTokenEdge(token: string | undefined): Promise<{ username: string; role: string } | null> {
  if (!token) return null;
  try {
    const dot = token.lastIndexOf('.');
    if (dot === -1) return null;
    const payload = token.slice(0, dot);
    const sig     = token.slice(dot + 1);

    const secretStr = process.env.ADMIN_SECRET ?? 'fallback-dev-secret';
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secretStr),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );

    // base64url → Uint8Array
    const sigBytes = Uint8Array.from(
      atob(sig.replace(/-/g, '+').replace(/_/g, '/')),
      (c) => c.charCodeAt(0),
    );

    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(payload));
    if (!valid) return null;

    const { u, r, t } = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    if (Date.now() - t > 7 * 24 * 60 * 60 * 1000) return null;
    return { username: u as string, role: r as string };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const res = NextResponse.next();
  res.headers.set('x-pathname', pathname);

  if (pathname === '/admin/login') return res;

  // ── Admin session (full access) ────────────────────────────────────────────
  const adminToken = request.cookies.get(SESSION_COOKIE)?.value?.trim();
  const secret     = (process.env.ADMIN_SECRET ?? '').trim();
  if (adminToken && secret && safeEqualEdge(adminToken, await adminSessionTokenEdge(secret))) return res;

  // ── Staff session (restricted access) ─────────────────────────────────────
  const staffToken = request.cookies.get(STAFF_COOKIE)?.value;
  const staffInfo  = await verifyStaffTokenEdge(staffToken);

  if (staffInfo) {
    if (staffInfo.role === 'volunteer') {
      const allowed =
        VOLUNTEER_ALLOWED_EXACT.includes(pathname) ||
        VOLUNTEER_ALLOWED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
      if (!allowed) {
        const url = request.nextUrl.clone();
        url.pathname = '/admin/scan';
        return NextResponse.redirect(url);
      }
    }

    if (staffInfo.role === 'viewer' && pathname !== '/admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/admin';
      return NextResponse.redirect(url);
    }

    return res;
  }

  // ── No valid session → login ───────────────────────────────────────────────
  const url = request.nextUrl.clone();
  url.pathname = '/admin/login';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/admin/:path*'],
};
