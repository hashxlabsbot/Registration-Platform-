// Read-only diagnostic: finds ticket_pdfs rows that don't map to any current
// attendee (primary registrant or a member of a live booking).
//
// Run with the production DB URL:
//   DATABASE_URL="postgres://..." node scripts/find-orphan-tickets.mjs
import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('Set DATABASE_URL, e.g. DATABASE_URL="postgres://..." node scripts/find-orphan-tickets.mjs');
  process.exit(1);
}
const sql = neon(url);

// 1. Build the set of booking_ids that *should* have a ticket.
const regs = await sql`SELECT booking_id, members_json FROM registrations`;
const valid = new Set();
let attendees = 0;
for (const r of regs) {
  valid.add(r.booking_id);
  attendees++;
  let members = [];
  try { members = JSON.parse(r.members_json ?? '[]'); } catch {}
  members.forEach((_, i) => { valid.add(`${r.booking_id}-M${i + 1}`); attendees++; });
}

// 2. Compare against what's actually in ticket_pdfs.
const pdfs = await sql`SELECT booking_id FROM ticket_pdfs ORDER BY booking_id`;
const orphans = pdfs.filter((p) => !valid.has(p.booking_id)).map((p) => p.booking_id);
const missing = [...valid].filter((id) => !pdfs.some((p) => p.booking_id === id));

console.log('registrations (bookings):', regs.length);
console.log('expected attendee tickets:', attendees);
console.log('ticket_pdfs rows:', pdfs.length);
console.log('\nORPHAN PDFs (in ZIP but no live attendee):', orphans.length);
console.log(orphans.join('\n'));
console.log('\nMISSING tickets (live attendee with no PDF):', missing.length);
console.log(missing.join('\n'));
