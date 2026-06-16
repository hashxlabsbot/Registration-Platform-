import { getDb, initSchema } from './db';

export interface Member {
  name:        string;
  relation:    string;
  email:       string;
  phone:       string;
  checkedIn?:  boolean;
  checkinTime?: string;
}

export interface RegistrationInput {
  bookingId: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  gender: string;
  nationality: string;
  organization: string;
  designation: string;
  coaNumber: string;
  iiaMembershipNumber: string;
  registrationType: string;
  totalAmount: number;
  utrNumber: string;
  address: string;
  district: string;
  state: string;
  pincode: string;
  membersJson?: string;
}

export interface Registration {
  bookingId: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  gender: string;
  nationality: string;
  organization: string;
  designation: string;
  coaNumber: string;
  iiaMembershipNumber: string;
  registrationType: string;
  amount: number;
  utrNumber: string;
  address: string;
  district: string;
  state: string;
  pincode: string;
  registeredAt: string;
  checkedIn: boolean;
  checkinTime: string;
  membersJson: string;
  members: Member[];
}

function toIST(date: Date | string | null | undefined): string {
  if (!date) return '';
  return new Date(date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
}

// A member check-in row, keyed by member_index (1-based) within a booking.
interface MemberCheckinRow { checked_in: boolean; checkin_time: string | null }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToRegistration(row: any, memberCheckins?: Record<number, MemberCheckinRow>): Registration {
  const members: Member[] = (() => {
    try { return JSON.parse(row.members_json ?? '[]'); } catch { return []; }
  })();
  // Overlay per-member check-in state (member_index is 1-based).
  members.forEach((m, i) => {
    const c = memberCheckins?.[i + 1];
    m.checkedIn   = c?.checked_in ?? false;
    m.checkinTime = c?.checkin_time ? toIST(c.checkin_time) : '';
  });

  return {
    bookingId:           row.booking_id,
    name:                row.name,
    email:               row.email,
    phone:               row.phone,
    whatsapp:            row.whatsapp             ?? '',
    gender:              row.gender               ?? '',
    nationality:         row.nationality          ?? '',
    organization:        row.organization         ?? '',
    designation:         row.designation          ?? '',
    coaNumber:           row.coa_number           ?? '',
    iiaMembershipNumber: row.iia_membership_number ?? '',
    registrationType:    row.registration_type,
    amount:              Number(row.amount),
    utrNumber:           row.utr_number           ?? '',
    address:             row.address              ?? '',
    district:            row.district             ?? '',
    state:               row.state                ?? '',
    pincode:             row.pincode              ?? '',
    registeredAt:        toIST(row.registered_at),
    checkedIn:           row.checked_in           ?? false,
    checkinTime:         toIST(row.checkin_time),
    membersJson:         row.members_json         ?? '[]',
    members,
  };
}

export async function appendRegistration(data: RegistrationInput): Promise<void> {
  await initSchema();
  const sql = getDb();
  await sql`
    INSERT INTO registrations (
      booking_id, name, email, phone, whatsapp, gender, nationality,
      organization, designation, coa_number, iia_membership_number,
      registration_type, amount, utr_number,
      address, district, state, pincode, members_json
    ) VALUES (
      ${data.bookingId}, ${data.name}, ${data.email}, ${data.phone},
      ${data.whatsapp}, ${data.gender}, ${data.nationality},
      ${data.organization}, ${data.designation}, ${data.coaNumber},
      ${data.iiaMembershipNumber}, ${data.registrationType},
      ${data.totalAmount}, ${data.utrNumber},
      ${data.address}, ${data.district}, ${data.state}, ${data.pincode},
      ${data.membersJson ?? '[]'}
    )
    ON CONFLICT (booking_id) DO NOTHING
  `;
}

// Build a nested map: booking_id -> { member_index -> checkin row }.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function indexMemberCheckins(rows: any[]): Record<string, Record<number, MemberCheckinRow>> {
  const map: Record<string, Record<number, MemberCheckinRow>> = {};
  for (const r of rows) {
    (map[r.booking_id] ??= {})[Number(r.member_index)] = {
      checked_in:   r.checked_in,
      checkin_time: r.checkin_time,
    };
  }
  return map;
}

export async function getRegistrations(): Promise<Registration[]> {
  await initSchema();
  const sql = getDb();
  const [rows, memberRows] = await Promise.all([
    sql`SELECT * FROM registrations ORDER BY registered_at DESC`,
    sql`SELECT booking_id, member_index, checked_in, checkin_time FROM member_checkins`,
  ]);
  const memberMap = indexMemberCheckins(memberRows);
  return rows.map((r) => rowToRegistration(r, memberMap[r.booking_id]));
}

// Used for payment idempotency — returns the existing booking for a given
// UPI/Razorpay transaction id, if one was already recorded.
export async function findRegistrationByUtr(utrNumber: string): Promise<Registration | null> {
  await initSchema();
  const sql = getDb();
  const rows = await sql`SELECT * FROM registrations WHERE utr_number = ${utrNumber} LIMIT 1`;
  if (rows.length === 0) return null;
  return rowToRegistration(rows[0]);
}

export async function getRegistrationById(bookingId: string): Promise<Registration | null> {
  await initSchema();
  const sql = getDb();
  const [rows, memberRows] = await Promise.all([
    sql`SELECT * FROM registrations WHERE booking_id = ${bookingId} LIMIT 1`,
    sql`SELECT member_index, checked_in, checkin_time FROM member_checkins WHERE booking_id = ${bookingId}`,
  ]);
  if (rows.length === 0) return null;
  const memberMap = indexMemberCheckins(memberRows.map((m) => ({ ...m, booking_id: bookingId })));
  return rowToRegistration(rows[0], memberMap[bookingId]);
}

export async function checkInRegistration(bookingId: string): Promise<{
  status: 'ok' | 'already' | 'not_found';
  registration?: Registration;
}> {
  await initSchema();
  const sql = getDb();

  const rows = await sql`
    SELECT * FROM registrations WHERE booking_id = ${bookingId} LIMIT 1
  `;

  if (rows.length === 0) return { status: 'not_found' };

  const reg = rowToRegistration(rows[0]);

  if (reg.checkedIn) {
    return { status: 'already', registration: reg };
  }

  const updated = await sql`
    UPDATE registrations
    SET checked_in = TRUE, checkin_time = NOW()
    WHERE booking_id = ${bookingId}
    RETURNING *
  `;

  return { status: 'ok', registration: rowToRegistration(updated[0]) };
}

// Check in a single guest/member of a booking. memberIndex is 1-based and must
// point at an existing entry in the booking's members_json array.
export async function checkInMember(bookingId: string, memberIndex: number): Promise<{
  status: 'ok' | 'already' | 'not_found';
  registration?: Registration;
}> {
  await initSchema();
  const sql = getDb();

  const reg = await getRegistrationById(bookingId);
  if (!reg) return { status: 'not_found' };
  if (memberIndex < 1 || memberIndex > reg.members.length) return { status: 'not_found' };

  if (reg.members[memberIndex - 1]?.checkedIn) {
    return { status: 'already', registration: reg };
  }

  await sql`
    INSERT INTO member_checkins (booking_id, member_index, checked_in, checkin_time)
    VALUES (${bookingId}, ${memberIndex}, TRUE, NOW())
    ON CONFLICT (booking_id, member_index)
    DO UPDATE SET checked_in = TRUE, checkin_time = NOW()
  `;

  return { status: 'ok', registration: await getRegistrationById(bookingId) ?? reg };
}

// Reverse a check-in (admin-only). memberIndex 0 (or undefined) = primary
// registrant; >= 1 = a guest/member.
export async function undoCheckIn(bookingId: string, memberIndex = 0): Promise<{
  status: 'ok' | 'not_found';
  registration?: Registration;
}> {
  await initSchema();
  const sql = getDb();

  const reg = await getRegistrationById(bookingId);
  if (!reg) return { status: 'not_found' };

  if (memberIndex >= 1) {
    if (memberIndex > reg.members.length) return { status: 'not_found' };
    await sql`
      UPDATE member_checkins
      SET checked_in = FALSE, checkin_time = NULL
      WHERE booking_id = ${bookingId} AND member_index = ${memberIndex}
    `;
  } else {
    await sql`
      UPDATE registrations
      SET checked_in = FALSE, checkin_time = NULL
      WHERE booking_id = ${bookingId}
    `;
  }

  return { status: 'ok', registration: await getRegistrationById(bookingId) ?? reg };
}
