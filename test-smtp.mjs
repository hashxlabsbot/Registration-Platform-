// Run with: node test-smtp.mjs
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split('\n')
    .filter(l => l.trim() && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim()]; })
);

const apiKey     = env.BREVO_API_KEY;
const senderEmail = env.SENDER_EMAIL || 'prakriti2026.iiafaridabad@gmail.com';
const senderName  = env.SENDER_NAME  || 'Prakriti 2026 · IIA Faridabad';
const to          = env.ADMIN_EMAIL  || senderEmail;

console.log('BREVO_API_KEY :', apiKey ? apiKey.slice(0, 20) + '...' : 'MISSING ← set this in .env');
console.log('Sender        :', `${senderName} <${senderEmail}>`);
console.log('Sending to    :', to);
console.log('');

if (!apiKey) {
  console.error('ERROR: BREVO_API_KEY is not set in .env');
  console.error('Go to app.brevo.com → Settings → SMTP & API → API Keys → generate one');
  process.exit(1);
}

console.log('Calling Brevo API...');
const res = await fetch('https://api.brevo.com/v3/smtp/email', {
  method: 'POST',
  headers: {
    'accept':       'application/json',
    'content-type': 'application/json',
    'api-key':      apiKey,
  },
  body: JSON.stringify({
    sender:      { name: senderName, email: senderEmail },
    to:          [{ email: to }],
    subject:     'Brevo API Test — Prakriti 2026',
    htmlContent: '<p>If you see this, <strong>Brevo HTTP API is working correctly</strong>. Emails will be sent for real registrations.</p>',
  }),
});

const body = await res.text();
if (res.ok) {
  console.log('✓ Email sent successfully! Response:', body);
  console.log('\nBrevo is ready. Restart your dev server and registrations will send emails.');
} else {
  console.error('✗ Failed with status', res.status);
  console.error('  Response:', body);
  if (res.status === 401) console.error('\n  → API key is wrong. Regenerate at app.brevo.com → Settings → SMTP & API → API Keys');
  if (res.status === 400) console.error('\n  → Sender email not verified. Go to app.brevo.com → Settings → Senders & IPs → Senders → add ' + senderEmail);
}
