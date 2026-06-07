import { NextRequest, NextResponse } from 'next/server';
import { checkInRegistration } from '@/lib/registrations';
import { isValidSession, SESSION_COOKIE } from '@/lib/auth';
import { verifyStaffToken, STAFF_COOKIE } from '@/lib/staff-auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const adminCookie = request.cookies.get(SESSION_COOKIE)?.value;
  const staffCookie = request.cookies.get(STAFF_COOKIE)?.value;
  const isAdmin = isValidSession(adminCookie);
  const staffInfo = verifyStaffToken(staffCookie);
  if (!isAdmin && !staffInfo) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { bookingId } = await request.json();
  if (!bookingId) {
    return NextResponse.json({ error: 'bookingId is required.' }, { status: 400 });
  }

  const result = await checkInRegistration(String(bookingId));
  return NextResponse.json(result);
}
