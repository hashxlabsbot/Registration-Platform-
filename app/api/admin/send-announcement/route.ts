import { NextRequest, NextResponse } from 'next/server';
import { isValidSession, SESSION_COOKIE } from '@/lib/auth';
import { getRegistrations } from '@/lib/registrations';

export const runtime = 'nodejs';

const BREVO_API = 'https://api.brevo.com/v3/smtp/email';

type RecipientFilter = 'all' | 'checked_in' | 'pending' | 'architect_iia' | 'architect_non_iia' | 'non_architect' | 'special_invitee';

export async function POST(request: NextRequest) {
  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  if (!isValidSession(cookie)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { subject, message, recipients } = (await request.json()) as {
    subject: string;
    message: string;
    recipients: RecipientFilter;
  };

  if (!subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'subject and message are required' }, { status: 400 });
  }

  const all = await getRegistrations();

  const filtered = all.filter((r) => {
    if (recipients === 'checked_in')        return r.checkedIn;
    if (recipients === 'pending')           return !r.checkedIn;
    if (recipients === 'architect_iia')     return r.registrationType.toLowerCase().includes('iia member');
    if (recipients === 'architect_non_iia') return r.registrationType.toLowerCase().includes('non-iia') || r.registrationType.toLowerCase().includes('non iia');
    if (recipients === 'non_architect')     return r.registrationType.toLowerCase().includes('non-architect') || r.registrationType.toLowerCase().includes('non architect') || r.registrationType.toLowerCase() === 'delegate';
    if (recipients === 'special_invitee')   return r.registrationType.toLowerCase().includes('special');
    return true; // 'all'
  });

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'BREVO_API_KEY not configured' }, { status: 500 });

  const senderEmail = process.env.SENDER_EMAIL || 'prakriti2026.iiafaridabad@gmail.com';
  const senderName  = process.env.SENDER_NAME  || 'Prakriti 2026 · IIA Faridabad';

  const htmlContent = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:32px;border-radius:12px;">
      <div style="background:#050d07;padding:20px 24px;border-radius:8px;margin-bottom:24px;">
        <p style="color:#c8a96e;font-size:11px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;margin:0 0 4px;">Prakriti 2026 · IIA Faridabad</p>
        <h1 style="color:#ffffff;font-size:20px;margin:0;">${subject}</h1>
      </div>
      <div style="background:#ffffff;padding:24px;border-radius:8px;color:#333;line-height:1.7;white-space:pre-wrap;">${message}</div>
      <p style="color:#999;font-size:11px;text-align:center;margin-top:24px;">
        Prakriti 2026 · Saffron Hall, Vardaan Grand, Faridabad
      </p>
    </div>
  `;

  let sent = 0;
  let failed = 0;

  for (const reg of filtered) {
    try {
      const res = await fetch(BREVO_API, {
        method: 'POST',
        headers: {
          'accept':       'application/json',
          'content-type': 'application/json',
          'api-key':      apiKey,
        },
        body: JSON.stringify({
          sender:      { email: senderEmail, name: senderName },
          to:          [{ email: reg.email, name: reg.name }],
          subject,
          htmlContent,
        }),
      });
      if (res.ok) sent++; else failed++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ sent, failed, total: filtered.length });
}
