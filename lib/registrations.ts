import { getDb, initSchema } from './db';

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
}

function toIST(date: Date | null | undefined): string {
  if (!date) return '';
  return new Date(date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToRegistration(row: any): Registration {
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

export async function getRegistrations(): Promise<Registration[]> {
  await initSchema();
  const sql = getDb();
  const rows = await sql`
    SELECT * FROM registrations ORDER BY registered_at DESC
  `;
  return rows.map(rowToRegistration);
}

export async function getRegistrationById(bookingId: string): Promise<Registration | null> {
  await initSchema();
  const sql = getDb();
  const rows = await sql`
    SELECT * FROM registrations WHERE booking_id = ${bookingId} LIMIT 1
  `;
  return rows.length > 0 ? rowToRegistration(rows[0]) : null;
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
