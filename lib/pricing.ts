// ── Authoritative, server-side pricing ──────────────────────────────────────
// This is the single source of truth for registration prices. The client must
// NEVER be trusted to send an amount — it is always recomputed here from the
// registration type and member count.

export const REGISTRATION_PRICES: Record<string, number> = {
  'Architect - IIA Member':     500,
  'Architect - Non-IIA Member': 1000,
  'Non-Architect':              2500,
  'Special Invitee':            0,
};

export const MEMBER_FEE = 1000;

export function isValidRegistrationType(registrationType: unknown): registrationType is string {
  return typeof registrationType === 'string' && registrationType in REGISTRATION_PRICES;
}

// Returns the total amount in rupees for a registration, or null if the
// registration type is unknown. membersCount is clamped to a sane range.
export function computeTotalAmount(registrationType: string, membersCount: number): number | null {
  if (!isValidRegistrationType(registrationType)) return null;
  if (registrationType === 'Special Invitee') return 0;

  const base = REGISTRATION_PRICES[registrationType];
  const members = Number.isFinite(membersCount) ? Math.max(0, Math.min(50, Math.trunc(membersCount))) : 0;
  return base + members * MEMBER_FEE;
}
