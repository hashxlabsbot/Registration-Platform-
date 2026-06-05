import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getRegistrations } from '@/lib/registrations';
import { isValidSession, SESSION_COOKIE } from '@/lib/auth';

export const runtime = 'nodejs';

const HEADERS = [
  'Booking ID', 'Name', 'Email', 'Phone', 'WhatsApp',
  'Gender', 'Nationality', 'Organization', 'Designation',
  'COA Number', 'IIA Membership No.', 'Registration Type', 'Amount (₹)',
  'UPI Transaction ID / UTR',
  'Address', 'District', 'State', 'Pincode', 'Registered At (IST)',
  'Checked In', 'Check-in Time (IST)',
  'Additional Members Count',
  'Member 1 Name', 'Member 1 Relation', 'Member 1 Email', 'Member 1 Phone',
  'Member 2 Name', 'Member 2 Relation', 'Member 2 Email', 'Member 2 Phone',
  'Member 3 Name', 'Member 3 Relation', 'Member 3 Email', 'Member 3 Phone',
];

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  const cookie = request.cookies.get(SESSION_COOKIE)?.value;

  const authorized =
    (secret && process.env.ADMIN_SECRET && secret.trim() === process.env.ADMIN_SECRET.trim()) ||
    isValidSession(cookie);

  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const registrations = await getRegistrations();

  if (registrations.length === 0) {
    return NextResponse.json({ error: 'No registrations yet.' }, { status: 404 });
  }

  const rows = registrations.map((r) => {
    const ms = r.members ?? [];
    const memberCols: (string | number)[] = [];
    for (let i = 0; i < 3; i++) {
      const m = ms[i];
      memberCols.push(m?.name ?? '', m?.relation ?? '', m?.email ?? '', m?.phone ?? '');
    }
    return [
      r.bookingId, r.name, r.email, r.phone, r.whatsapp,
      r.gender, r.nationality, r.organization, r.designation,
      r.coaNumber, r.iiaMembershipNumber, r.registrationType,
      r.amount, r.utrNumber,
      r.address, r.district, r.state, r.pincode, r.registeredAt,
      r.checkedIn ? 'YES' : 'NO', r.checkinTime,
      ms.length,
      ...memberCols,
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...rows]);
  ws['!cols'] = HEADERS.map((h) => ({ wch: Math.max(h.length + 4, 20) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Registrations');

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const date   = new Date().toISOString().slice(0, 10);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="prakriti2026-registrations-${registrations.length}-entries-${date}.xlsx"`,
      'X-Registration-Count': String(registrations.length),
    },
  });
}
