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
    data.whatsapp   || '—',
    data.gender      || '—',
    data.nationality || '—',
    data.organization || '—',
    data.designation  || '—',
    data.coaNumber    || '—',
    data.iiaMembershipNumber || '—',
    data.registrationType,
    data.totalAmount,
    data.utrNumber,
    data.address  || '—',
    data.district || '—',
    data.state    || '—',
    data.pincode  || '—',
    now,
  ]], { origin: -1 });

  // Auto-fit column widths
  ws['!cols'] = HEADERS.map((h, i) => ({ wch: Math.max(h.length, i === 0 ? 14 : 20) }));

  XLSX.writeFile(wb, FILE_PATH);
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
  return Math.max(0, range.e.r); // subtract header row
}

function styleHeaderRow(ws: XLSX.WorkSheet) {
  // SheetJS CE doesn't support full cell styling, but we can set column widths
  ws['!cols'] = HEADERS.map((h) => ({ wch: Math.max(h.length + 4, 20) }));
}
