import { NextRequest, NextResponse } from 'next/server';
import { isValidSession, SESSION_COOKIE } from '@/lib/auth';
import { getDb, initSchema } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  if (!isValidSession(cookie)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await initSchema();
  const sql = getDb();

  // Hourly buckets (IST)
  const buckets = await sql`
    SELECT
      TO_CHAR(DATE_TRUNC('hour', checkin_time AT TIME ZONE 'Asia/Kolkata'), 'HH12:MI AM') AS hour_label,
      DATE_TRUNC('hour', checkin_time AT TIME ZONE 'Asia/Kolkata') AS bucket,
      COUNT(*)::int AS count
    FROM registrations
    WHERE checked_in = TRUE AND checkin_time IS NOT NULL
    GROUP BY bucket, hour_label
    ORDER BY bucket ASC
  `;

  // 20 most recent check-ins
  const recent = await sql`
    SELECT booking_id, name, registration_type, checkin_time
    FROM registrations
    WHERE checked_in = TRUE AND checkin_time IS NOT NULL
    ORDER BY checkin_time DESC
    LIMIT 20
  `;

  const recentList = recent.map((r) => ({
    bookingId: r.booking_id,
    name: r.name,
    registrationType: r.registration_type,
    checkinTime: new Date(r.checkin_time as string).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
  }));

  return NextResponse.json({
    timeline: buckets.map((b) => ({ label: b.hour_label, count: b.count })),
    recent: recentList,
  });
}
