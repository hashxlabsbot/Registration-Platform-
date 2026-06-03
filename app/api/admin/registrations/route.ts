import { NextRequest, NextResponse } from 'next/server';
import { getRegistrations } from '@/lib/registrations';
import { isValidSession, SESSION_COOKIE } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  if (!isValidSession(cookie)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const registrations = await getRegistrations();
  return NextResponse.json({ registrations });
}
