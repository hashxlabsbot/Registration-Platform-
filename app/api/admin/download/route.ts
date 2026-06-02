import { NextRequest, NextResponse } from 'next/server';
import { getRegistrationsBuffer, getRegistrationCount } from '@/lib/sheet';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');

  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const buffer = getRegistrationsBuffer();

  if (!buffer) {
    return NextResponse.json({ error: 'No registrations yet.' }, { status: 404 });
  }

  const count = getRegistrationCount();
  const date  = new Date().toISOString().slice(0, 10);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="prakriti2026-registrations-${count}-entries-${date}.xlsx"`,
      'X-Registration-Count': String(count),
    },
  });
}
