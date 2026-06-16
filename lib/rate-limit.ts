import { NextRequest } from 'next/server';

// ── Lightweight in-memory rate limiter ──────────────────────────────────────
// Fixed-window counter keyed by `${bucket}:${ip}`. This is per-instance (not
// shared across serverless instances), so it is a best-effort throttle to blunt
// brute-force / abuse — not a hard distributed quota. Good enough for the auth
// and invite-validation endpoints on a single-event app.

interface Entry { count: number; resetAt: number }

const store = new Map<string, Entry>();

function sweep(now: number) {
  if (store.size < 5000) return; // only sweep when the map grows
  for (const [k, v] of store) if (v.resetAt <= now) store.delete(k);
}

export function clientIp(request: NextRequest): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

// Returns true if the request is allowed, false if the limit is exceeded.
export function rateLimit(
  request: NextRequest,
  bucket: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  sweep(now);
  const key = `${bucket}:${clientIp(request)}`;
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count += 1;
  return true;
}
