import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { appendRegistration } from '@/lib/registrations';
import { consumeInviteCode } from '@/lib/invite-codes';
import { sendTicketEmail, sendAdminNotification } from '@/lib/mailer';
import { isRegistrationClosed } from '@/lib/registration-status';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (isRegistrationClosed()) {
    return NextResponse.json(
      { error: 'Registrations are now closed. Thank you for your interest in Prakriti 2026.' },
      { status: 410 }
    );
  }

  try {
    const body = await request.json();

    const {
      name, email, phone, whatsapp, gender, nationality,
      firm, designation, address, district, state, pincode,
      registrationType, coaNumber, iiaMembershipNumber, totalAmount,
      utrNumber, inviteCode, members,
    } = body;

    if (!name || !email || !phone || !registrationType) {
      return NextResponse.json({ error: 'Required fields are missing.' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }

    const isSpecialInvitee = registrationType === 'Special Invitee';
    const bookingId = `PK-${nanoid(8).toUpperCase()}`;

    // Invite code — atomically consume FIRST so it is the single source of
    // truth. A concurrent request for the same code will fail the atomic
    // UPDATE, preventing double-use of a single-use code.
    if (isSpecialInvitee) {
      if (!inviteCode || typeof inviteCode !== 'string') {
        return NextResponse.json({ error: 'Invite code is required for Special Invitee.' }, { status: 400 });
      }
      const consumed = await consumeInviteCode(inviteCode, bookingId);
      if (!consumed) {
        return NextResponse.json({ error: 'Invalid or already used invite code.' }, { status: 400 });
      }
    } else {
      // Paid registration — UTR required
      if (!utrNumber || String(utrNumber).trim().length < 6) {
        return NextResponse.json({ error: 'UPI Transaction ID / UTR number is required.' }, { status: 400 });
      }
    }

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
      membersJson:         JSON.stringify(Array.isArray(members) ? members : []),
    });

    // Send confirmation email + admin notification (fire-and-forget)
    const ticketData = {
      bookingId,
      name,
      email,
      phone,
      organization:    firm        || '—',
      designation:     designation || '—',
      registrationType,
      totalAmount:     isSpecialInvitee ? 0 : Number(totalAmount),
      utrNumber:       isSpecialInvitee ? 'INVITE' : String(utrNumber).trim(),
      eventName:       process.env.EVENT_NAME     || 'Prakriti 2026',
      eventSubtitle:   process.env.EVENT_SUBTITLE || 'Architects for a Sustainable Tomorrow',
      eventDate:       process.env.EVENT_DATE     || 'Saturday, 20 June 2026 · 3:00 PM',
      eventVenue:      process.env.EVENT_VENUE    || 'Saffron Hall, Vardaan Grand — Sector-21C, GymKhana Club, Surajkund Road, Faridabad',
      organizer:       process.env.ORGANIZER      || 'The Indian Institute of Architects — Faridabad Centre',
    };
    await Promise.all([
      sendTicketEmail(ticketData, isSpecialInvitee).catch(err => console.error('[email:ticket]', err)),
      sendAdminNotification({
        ...ticketData,
        gender:              gender              || '',
        nationality:         nationality         || '',
        whatsapp:            whatsapp            || '',
        address:             address             || '',
        district:            district            || '',
        state:               state               || '',
        pincode:             pincode             || '',
        coaNumber:           coaNumber           || '',
        iiaMembershipNumber: iiaMembershipNumber || '',
        members:             Array.isArray(members) ? members : [],
      }).catch(err => console.error('[email:admin]', err)),
    ]);

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
