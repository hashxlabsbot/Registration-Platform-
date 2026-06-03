export const SESSION_COOKIE = 'admin_session';

export function isValidSession(cookieValue: string | undefined): boolean {
  if (!cookieValue || !process.env.ADMIN_SECRET) return false;
  return cookieValue === process.env.ADMIN_SECRET;
}
