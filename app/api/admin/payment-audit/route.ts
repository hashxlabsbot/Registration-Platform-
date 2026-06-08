import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { getDb, initSchema } from '@/lib/db';
import { isValidSession, SESSION_COOKIE } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  if (!isValidSession(cookie)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const razorpay = new Razorpay({
    key_id:     process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

  // Fetch all payments from Razorpay (paginated, max 100 per call)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allPayments: any[] = [];
  let skip = 0;
  while (true) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await razorpay.payments.all({ count: 100, skip });
    const items = result.items ?? [];
    allPayments.push(...items);
    if (items.length < 100) break;
    skip += 100;
  }

  // Only include captured payments whose amount (in rupees) is a multiple of ₹500
  // — covers all valid registration fees: ₹500, ₹1000, ₹1500, ₹2000, ₹2500, ₹3000, ₹3500 …
  const capturedPayments = allPayments.filter((p) => {
    if (p.status !== 'captured') return false;
    const amountRupees = Number(p.amount) / 100;
    return amountRupees % 500 === 0;
  });

  // All Razorpay payment IDs already registered in DB
  await initSchema();
  const sql = getDb();
  const dbRows = await sql`SELECT utr_number FROM registrations WHERE utr_number LIKE 'pay_%'`;
  const dbUtrSet = new Set(dbRows.map((r) => r.utr_number as string));

  const unmatched = capturedPayments.filter((p) => !dbUtrSet.has(p.id as string));

  // Enrich each unmatched payment with order notes (name, email, reg type, etc.)
  const enriched = await Promise.all(
    unmatched.map(async (payment) => {
      let orderNotes: Record<string, string> = {};
      if (payment.order_id) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const order: any = await razorpay.orders.fetch(payment.order_id as string);
          orderNotes = (order.notes as Record<string, string>) ?? {};
        } catch { /* non-fatal */ }
      }

      const contactRaw = String(payment.contact ?? '');
      const phone = orderNotes.phone || (contactRaw.startsWith('+91') ? contactRaw.slice(3) : contactRaw);

      return {
        paymentId:        payment.id as string,
        orderId:          (payment.order_id ?? '') as string,
        amount:           Number(payment.amount) / 100,
        email:            orderNotes.email            || (payment.email as string ?? ''),
        name:             orderNotes.attendee         ?? '',
        phone,
        organization:     orderNotes.organization     ?? '',
        designation:      orderNotes.designation      ?? '',
        registrationType: orderNotes.registrationType ?? '',
        district:         orderNotes.district         ?? '',
        state:            orderNotes.state            ?? '',
        coaNumber:        orderNotes.coaNumber        ?? '',
        iiaMembershipNumber: orderNotes.iiaMembershipNumber ?? '',
        membersCount:     Number(orderNotes.membersCount ?? '0'),
        createdAt:        new Date((payment.created_at as number) * 1000).toISOString(),
      };
    }),
  );

  return NextResponse.json({
    totalCaptured: capturedPayments.length,
    inDb:          capturedPayments.length - unmatched.length,
    unmatchedCount: unmatched.length,
    unmatched: enriched,
  });
}
