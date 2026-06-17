// Single source of truth for whether event registration is open.
// Registration was extended to 17 June 2026, 23:59:59 IST.
export const REGISTRATION_DEADLINE = new Date('2026-06-17T23:59:59+05:30').getTime();

// Hard override — set to `true` to close registration immediately,
// regardless of the deadline above.
export const REGISTRATION_FORCE_CLOSED = true;

export function isRegistrationClosed(): boolean {
  return REGISTRATION_FORCE_CLOSED || Date.now() > REGISTRATION_DEADLINE;
}
