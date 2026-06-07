import { createHmac, pbkdf2Sync, randomBytes } from 'crypto';

export const STAFF_COOKIE = 'staff_session';

// ── Token (stateless, HMAC-signed) ──────────────────────────────────────────

function secret() {
  return process.env.ADMIN_SECRET ?? 'fallback-dev-secret';
}

export function createStaffToken(username: string, role: string): string {
  const payload = Buffer.from(JSON.stringify({ u: username, r: role, t: Date.now() })).toString('base64url');
  const sig = createHmac('sha256', secret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyStaffToken(token: string | undefined): { username: string; role: string } | null {
  if (!token) return null;
  try {
    const dot = token.lastIndexOf('.');
    if (dot === -1) return null;
    const payload = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expected = createHmac('sha256', secret()).update(payload).digest('base64url');
    if (sig !== expected) return null;
    const { u, r, t } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    // 7-day expiry
    if (Date.now() - t > 7 * 24 * 60 * 60 * 1000) return null;
    return { username: u, role: r };
  } catch {
    return null;
  }
}

// ── Password hashing (PBKDF2-SHA512) ────────────────────────────────────────

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, 100_000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const derived = pbkdf2Sync(password, salt, 100_000, 64, 'sha512').toString('hex');
  return derived === hash;
}
