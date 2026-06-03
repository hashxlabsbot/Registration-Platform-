import { google } from 'googleapis';
import type { RegistrationRow } from './sheet';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const HEADERS = [
  'Booking ID', 'Name', 'Email', 'Phone', 'WhatsApp',
  'Gender', 'Nationality', 'Organization', 'Designation',
  'COA Number', 'IIA Membership No.', 'Registration Type', 'Amount (₹)',
  'UPI Transaction ID / UTR',
  'Address', 'District', 'State', 'Pincode', 'Registered At (IST)',
  'Checked In', 'Check-in Time (IST)',
];

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
}

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key   = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!email || !key) return null;
  return new google.auth.JWT({ email, key, scopes: SCOPES });
}

function rowToRegistration(row: string[]): Registration {
  return {
    bookingId:           row[0]  ?? '',
    name:                row[1]  ?? '',
    email:               row[2]  ?? '',
    phone:               row[3]  ?? '',
    whatsapp:            row[4]  ?? '',
    gender:              row[5]  ?? '',
    nationality:         row[6]  ?? '',
    organization:        row[7]  ?? '',
    designation:         row[8]  ?? '',
    coaNumber:           row[9]  ?? '',
    iiaMembershipNumber: row[10] ?? '',
    registrationType:    row[11] ?? '',
    amount:              Number(row[12] ?? 0),
    utrNumber:           row[13] ?? '',
    address:             row[14] ?? '',
    district:            row[15] ?? '',
    state:               row[16] ?? '',
    pincode:             row[17] ?? '',
    registeredAt:        row[18] ?? '',
    checkedIn:           row[19] === 'YES',
    checkinTime:         row[20] ?? '',
  };
}

export async function appendToSheet(data: RegistrationRow): Promise<void> {
  const auth          = getAuth();
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  if (!auth || !spreadsheetId) return;

  const sheets = google.sheets({ version: 'v4', auth });

  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Sheet1!A1:A1',
  }).catch(() => null);

  if (!existing?.data?.values?.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Sheet1!A1',
      valueInputOption: 'RAW',
      requestBody: { values: [HEADERS] },
    });
  }

  const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Sheet1!A1',
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [[
        data.bookingId,
        data.name,
        data.email,
        data.phone,
        data.whatsapp            || '—',
        data.gender              || '—',
        data.nationality         || '—',
        data.organization        || '—',
        data.designation         || '—',
        data.coaNumber           || '—',
        data.iiaMembershipNumber || '—',
        data.registrationType,
        data.totalAmount,
        data.utrNumber,
        data.address             || '—',
        data.district            || '—',
        data.state               || '—',
        data.pincode             || '—',
        now,
        '',  // Checked In — empty on registration
        '',  // Check-in Time — empty on registration
      ]],
    },
  });
}

export async function getRegistrations(): Promise<Registration[]> {
  const auth          = getAuth();
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  if (!auth || !spreadsheetId) return [];

  const sheets = google.sheets({ version: 'v4', auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Sheet1!A2:U',
  });

  return (res.data.values ?? []).map((row) => rowToRegistration(row as string[]));
}

export async function checkIn(bookingId: string): Promise<{
  status: 'ok' | 'already' | 'not_found';
  registration?: Registration;
}> {
  const auth          = getAuth();
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  if (!auth || !spreadsheetId) throw new Error('Google Sheets is not configured.');

  const sheets = google.sheets({ version: 'v4', auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Sheet1!A:U',
  });

  const rows = (res.data.values ?? []) as string[][];

  // rows[0] is the header; data starts at rows[1]
  const rowIndex = rows.findIndex((row, i) => i > 0 && row[0] === bookingId);

  if (rowIndex === -1) return { status: 'not_found' };

  const registration = rowToRegistration(rows[rowIndex]);

  if (rows[rowIndex][19] === 'YES') {
    return { status: 'already', registration };
  }

  const sheetRow = rowIndex + 1; // 1-based sheet row number
  const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Sheet1!T${sheetRow}:U${sheetRow}`,
    valueInputOption: 'RAW',
    requestBody: { values: [['YES', now]] },
  });

  registration.checkedIn  = true;
  registration.checkinTime = now;

  return { status: 'ok', registration };
}
