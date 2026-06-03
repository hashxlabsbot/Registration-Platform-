import { NextRequest, NextResponse } from 'next/server';
import { isValidSession, SESSION_COOKIE } from '@/lib/auth';
import { listInviteCodes, createInviteCode } from '@/lib/invite-codes';

export const runtime = 'nodejs';

function auth(req: NextRequest) {
  return isValidSession(req.cookies.get(SESSION_COOKIE)?.value?.trim());
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const codes = await listInviteCodes();
  return NextResponse.json({ codes });
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { description } = await req.json();
  const code = await createInviteCode(description ?? '');
  return NextResponse.json({ code });
}
