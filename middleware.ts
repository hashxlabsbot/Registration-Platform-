import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth';
import { STAFF_COOKIE, verifyStaffToken } from '@/lib/staff-auth';

// Pages/API routes a volunteer (staff) may access
const VOLUNTEER_ALLOWED = ['/admin/scan', '/api/admin/checkin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const res = NextResponse.next();
  res.headers.set('x-pathname', pathname);

  // Let the login page through
  if (pathname === '/admin/login') return res;

  // ── Admin session (full access) ────────────────────────────────────────────
  const adminToken = request.cookies.get(SESSION_COOKIE)?.value?.trim();
  const secret = (process.env.ADMIN_SECRET ?? '').trim();
  if (adminToken && secret && adminToken === secret) return res;

  // ── Staff/volunteer session (restricted access) ────────────────────────────
  const staffToken = request.cookies.get(STAFF_COOKIE)?.value;
  const staffInfo = verifyStaffToken(staffToken);
  if (staffInfo) {
    if (staffInfo.role === 'volunteer') {
      const allowed = VOLUNTEER_ALLOWED.some((p) => pathname === p || pathname.startsWith(p + '/'));
      if (!allowed) {
        const url = request.nextUrl.clone();
        url.pathname = '/admin/scan';
        return NextResponse.redirect(url);
      }
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
