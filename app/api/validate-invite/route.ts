import { NextRequest, NextResponse } from 'next/server';
import { isInviteCodeValid } from '@/lib/invite-codes';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Throttle to prevent brute-forcing invite codes.
    if (!rateLimit(request, 'validate-invite', 10, 60_000)) {
      return NextResponse.json({ valid: false, error: 'Too many attempts. Please try again later.' }, { status: 429 });
    }

    const { code } = await request.json();
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ valid: false, error: 'Invite code is required.' }, { status: 400 });
    }
    const valid = await isInviteCodeValid(code);
    if (!valid) {
      return NextResponse.json({ valid: false, error: 'Invalid or already used invite code.' }, { status: 400 });
    }
    return NextResponse.json({ valid: true });
  } catch (err) {
    console.error('[validate-invite]', err);
    return NextResponse.json({ valid: false, error: 'Validation failed.' }, { status: 500 });
  }
}
