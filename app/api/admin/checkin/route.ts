import { NextRequest, NextResponse } from 'next/server';
import { checkInRegistration, checkInMember, undoCheckIn } from '@/lib/registrations';
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

  const { bookingId, memberIndex, undo } = await request.json();
  if (!bookingId) {
    return NextResponse.json({ error: 'bookingId is required.' }, { status: 400 });
  }

  const idx = Number(memberIndex) || 0;

  // Undo is destructive — restrict to admins.
  if (undo) {
    if (!isAdmin) {
      return NextResponse.json({ error: 'Only admins can undo a check-in.' }, { status: 403 });
    }
    const result = await undoCheckIn(String(bookingId), idx);
    return NextResponse.json(result);
  }

  const result = idx >= 1
    ? await checkInMember(String(bookingId), idx)
    : await checkInRegistration(String(bookingId));

  return NextResponse.json(result);
}
