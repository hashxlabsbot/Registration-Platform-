import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { appendRegistration } from '@/lib/registrations';
import { isInviteCodeValid, consumeInviteCode } from '@/lib/invite-codes';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name, email, phone, whatsapp, gender, nationality,
      firm, designation, address, district, state, pincode,
      registrationType, coaNumber, iiaMembershipNumber, totalAmount,
      utrNumber, inviteCode,
    } = body;

    if (!name || !email || !phone || !registrationType) {
      return NextResponse.json({ error: 'Required fields are missing.' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }

    const isSpecialInvitee = registrationType === 'Special Invitee';

    // Invite code — validate & atomically consume
    if (isSpecialInvitee) {
      if (!inviteCode || typeof inviteCode !== 'string') {
        return NextResponse.json({ error: 'Invite code is required for Special Invitee.' }, { status: 400 });
      }
      const valid = await isInviteCodeValid(inviteCode);
      if (!valid) {
        return NextResponse.json({ error: 'Invalid or already used invite code.' }, { status: 400 });
      }
    } else {
      // Paid registration — UTR required
      if (!utrNumber || String(utrNumber).trim().length < 6) {
        return NextResponse.json({ error: 'UPI Transaction ID / UTR number is required.' }, { status: 400 });
      }
    }

    const bookingId = `PK-${nanoid(8).toUpperCase()}`;

    await appendRegistration({
      bookingId,
      name,
      email,
      phone,
      whatsapp:            whatsapp            || '',
      gender:              gender              || '',
      nationality:         nationality         || '',
      organization:        firm                || '',
      designation:         designation         || '',
      coaNumber:           coaNumber           || '',
      iiaMembershipNumber: iiaMembershipNumber || '',
      registrationType,
      totalAmount:         isSpecialInvitee ? 0 : Number(totalAmount),
      utrNumber:           isSpecialInvitee ? 'INVITE' : String(utrNumber).trim(),
      address:             address  || '',
      district:            district || '',
      state:               state    || '',
      pincode:             pincode  || '',
    });

    // Consume invite code after successful save
    if (isSpecialInvitee) {
      await consumeInviteCode(inviteCode, bookingId);
    }

    return NextResponse.json({
      success:          true,
      bookingId,
      name,
      email,
      phone,
      organization:     firm             || '—',
      designation:      designation      || '—',
      registrationType,
      totalAmount:      isSpecialInvitee ? 0 : Number(totalAmount),
      utrNumber:        isSpecialInvitee ? 'INVITE' : String(utrNumber).trim(),
    });
  } catch (error) {
    console.error('[register]', error);
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
