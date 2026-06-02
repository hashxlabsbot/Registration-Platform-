import { google } from 'googleapis';
import type { RegistrationRow } from './sheet';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const HEADERS = [
  'Booking ID', 'Name', 'Email', 'Phone', 'WhatsApp',
  'Gender', 'Nationality', 'Organization', 'Designation',
  'COA Number', 'IIA Membership No.', 'Registration Type', 'Amount (₹)',
  'UPI Transaction ID / UTR',
  'Address', 'District', 'State', 'Pincode', 'Registered At (IST)',
];

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key   = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!email || !key) return null;
  return new google.auth.JWT({ email, key, scopes: SCOPES });
}

export async function appendToSheet(data: RegistrationRow): Promise<void> {
  const auth         = getAuth();
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  if (!auth || !spreadsheetId) return; // silently skip if not configured

  const sheets = google.sheets({ version: 'v4', auth });

  // Ensure header row exists on first use
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
      ]],
    },
  });
}
