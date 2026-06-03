import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

const DATA_DIR  = path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'registrations.xlsx');
const SHEET     = 'Registrations';

const HEADERS = [
  'Booking ID', 'Name', 'Email', 'Phone', 'WhatsApp',
  'Gender', 'Nationality', 'Organization', 'Designation',
  'COA Number', 'IIA Membership No.', 'Registration Type', 'Amount (₹)',
  'UPI Transaction ID / UTR',
  'Address', 'District', 'State', 'Pincode', 'Registered At (IST)',
  'Checked In', 'Check-in Time (IST)',
];

export interface RegistrationRow {
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
}

function cellVal(ws: XLSX.WorkSheet, row: number, col: number): string {
  return String(ws[XLSX.utils.encode_cell({ r: row, c: col })]?.v ?? '');
}

function rowToRegistration(ws: XLSX.WorkSheet, row: number): Registration {
  return {
    bookingId:           cellVal(ws, row, 0),
    name:                cellVal(ws, row, 1),
    email:               cellVal(ws, row, 2),
    phone:               cellVal(ws, row, 3),
    whatsapp:            cellVal(ws, row, 4),
    gender:              cellVal(ws, row, 5),
    nationality:         cellVal(ws, row, 6),
    organization:        cellVal(ws, row, 7),
    designation:         cellVal(ws, row, 8),
    coaNumber:           cellVal(ws, row, 9),
    iiaMembershipNumber: cellVal(ws, row, 10),
    registrationType:    cellVal(ws, row, 11),
    amount:              Number(ws[XLSX.utils.encode_cell({ r: row, c: 12 })]?.v ?? 0),
    utrNumber:           cellVal(ws, row, 13),
    address:             cellVal(ws, row, 14),
    district:            cellVal(ws, row, 15),
    state:               cellVal(ws, row, 16),
    pincode:             cellVal(ws, row, 17),
    registeredAt:        cellVal(ws, row, 18),
    checkedIn:           cellVal(ws, row, 19) === 'YES',
    checkinTime:         cellVal(ws, row, 20),
  };
}

export function appendRegistration(data: RegistrationRow): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  let wb: XLSX.WorkBook;
  let ws: XLSX.WorkSheet;

  if (fs.existsSync(FILE_PATH)) {
    wb = XLSX.readFile(FILE_PATH);
    ws = wb.Sheets[SHEET] ?? XLSX.utils.aoa_to_sheet([HEADERS]);
    if (!wb.Sheets[SHEET]) XLSX.utils.book_append_sheet(wb, ws, SHEET);
  } else {
    ws = XLSX.utils.aoa_to_sheet([HEADERS]);
    styleHeaderRow(ws);
    wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, SHEET);
  }

  const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  XLSX.utils.sheet_add_aoa(ws, [[
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
    '',  // Checked In
    '',  // Check-in Time
  ]], { origin: -1 });

  ws['!cols'] = HEADERS.map((h, i) => ({ wch: Math.max(h.length, i === 0 ? 14 : 20) }));

  XLSX.writeFile(wb, FILE_PATH);
}

export function getRegistrations(): Registration[] {
  if (!fs.existsSync(FILE_PATH)) return [];

  const wb = XLSX.readFile(FILE_PATH);
  const ws = wb.Sheets[SHEET];
  if (!ws || !ws['!ref']) return [];

  const range = XLSX.utils.decode_range(ws['!ref']);
  const result: Registration[] = [];

  for (let row = 1; row <= range.e.r; row++) {
    const id = cellVal(ws, row, 0);
    if (!id) continue;
    result.push(rowToRegistration(ws, row));
  }

  return result;
}

export function checkInRegistration(bookingId: string): {
  status: 'ok' | 'already' | 'not_found';
  registration?: Registration;
} {
  if (!fs.existsSync(FILE_PATH)) return { status: 'not_found' };

  const wb = XLSX.readFile(FILE_PATH);
  const ws = wb.Sheets[SHEET];
  if (!ws || !ws['!ref']) return { status: 'not_found' };

  const range = XLSX.utils.decode_range(ws['!ref']);

  for (let row = 1; row <= range.e.r; row++) {
    if (cellVal(ws, row, 0) !== bookingId) continue;

    if (cellVal(ws, row, 19) === 'YES') {
      return { status: 'already', registration: rowToRegistration(ws, row) };
    }

    const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    ws[XLSX.utils.encode_cell({ r: row, c: 19 })] = { t: 's', v: 'YES' };
    ws[XLSX.utils.encode_cell({ r: row, c: 20 })] = { t: 's', v: now };

    // Extend ref to cover new columns
    if (range.e.c < 20) {
      range.e.c = 20;
      ws['!ref'] = XLSX.utils.encode_range(range);
    }

    XLSX.writeFile(wb, FILE_PATH);

    const registration = rowToRegistration(ws, row);
    return { status: 'ok', registration };
  }

  return { status: 'not_found' };
}

export function getRegistrationsBuffer(): Buffer | null {
  if (!fs.existsSync(FILE_PATH)) return null;
  return fs.readFileSync(FILE_PATH);
}

export function getRegistrationCount(): number {
  if (!fs.existsSync(FILE_PATH)) return 0;
  const wb = XLSX.readFile(FILE_PATH);
  const ws = wb.Sheets[SHEET];
  if (!ws) return 0;
  const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1');
  return Math.max(0, range.e.r);
}

function styleHeaderRow(ws: XLSX.WorkSheet) {
  ws['!cols'] = HEADERS.map((h) => ({ wch: Math.max(h.length + 4, 20) }));
}
