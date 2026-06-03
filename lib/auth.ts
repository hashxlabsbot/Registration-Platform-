export const SESSION_COOKIE = 'admin_session';

export function isValidSession(cookieValue: string | undefined): boolean {
  const secret = (process.env.ADMIN_SECRET ?? '').trim();
  if (!cookieValue || !secret) return false;
  return cookieValue.trim() === secret;
}
