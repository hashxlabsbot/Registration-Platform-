import { createHmac, timingSafeEqual } from 'crypto';

export const SESSION_COOKIE = 'admin_session';

// The admin session cookie holds an HMAC token derived from ADMIN_SECRET — NOT
// the secret itself. This way a leaked cookie never exposes the master secret,
// and validation is constant-time.
export function adminSessionToken(secret: string): string {
  return createHmac('sha256', secret).update('admin-session-v1').digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// Constant-time check of the admin password against ADMIN_SECRET.
export function isAdminSecret(candidate: string | undefined): boolean {
  const secret = (process.env.ADMIN_SECRET ?? '').trim();
  if (!secret || !candidate) return false;
  return safeEqual(candidate.trim(), secret);
}

export function isValidSession(cookieValue: string | undefined): boolean {
  const secret = (process.env.ADMIN_SECRET ?? '').trim();
  if (!cookieValue || !secret) return false;
  return safeEqual(cookieValue.trim(), adminSessionToken(secret));
}

export { STAFF_COOKIE, verifyStaffToken } from './staff-auth';
