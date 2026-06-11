import { NextRequest, NextResponse } from 'next/server';
import { getRegistrations } from '@/lib/registrations';
import { isValidSession, SESSION_COOKIE } from '@/lib/auth';
import { verifyStaffToken, STAFF_COOKIE } from '@/lib/staff-auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const adminCookie = request.cookies.get(SESSION_COOKIE)?.value;
  const staffCookie = request.cookies.get(STAFF_COOKIE)?.value;

  const isAdmin = isValidSession(adminCookie);
  const isStaff = !!verifyStaffToken(staffCookie);

  if (!isAdmin && !isStaff) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const registrations = await getRegistrations();
  const role = isAdmin ? 'admin' : (verifyStaffToken(staffCookie)?.role ?? 'staff');
  return NextResponse.json({ registrations, role });
}
