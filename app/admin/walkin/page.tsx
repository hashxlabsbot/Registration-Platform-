'use client';

import { useState, useMemo, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const REG_TYPES = [
  'Architect - IIA Member',
  'Architect - Non-IIA Member',
  'Non-Architect',
  'Special Invitee',
  'Delegate',
];

interface WalkinResult { bookingId: string; qr: Record<string, string> }
interface Reg { bookingId: string; name: string; email: string; phone: string; registrationType: string }

const card = { background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' };
const input = 'w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none';
const inputStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' };

export default function WalkinPage() {
  // ── Walk-in form ──
  const [form, setForm] = useState({ name: '', phone: '', email: '', organization: '', registrationType: 'Delegate', totalAmount: '' });
  const [sendEmail, setSendEmail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<WalkinResult | null>(null);
  const [error, setError] = useState('');

  function setField(k: keyof typeof form, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.phone.trim()) { setError('Name and phone are required.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/walkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, totalAmount: Number(form.totalAmount) || 0, sendEmail }),
      });
      const data = await res.json();
      if (res.ok) setResult(data);
      else setError(data.error || 'Failed to register walk-in.');
    } catch {
      setError('Network error. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setForm({ name: '', phone: '', email: '', organization: '', registrationType: 'Delegate', totalAmount: '' });
    setSendEmail(false);
    setResult(null);
    setError('');
  }

  // ── Resend ticket ──
  const [regs, setRegs] = useState<Reg[]>([]);
  const [resendQuery, setResendQuery] = useState('');
  const [resendMsg, setResendMsg] = useState<{ id: string; text: string; ok: boolean } | null>(null);
  const [resending, setResending] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/registrations').then((r) => r.ok ? r.json() : null).then((d) => { if (d?.registrations) setRegs(d.registrations); });
  }, []);

  const matches = useMemo(() => {
    const q = resendQuery.toLowerCase().trim();
    if (!q) return [];
    return regs.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      (r.email || '').toLowerCase().includes(q) ||
      r.phone.includes(q) ||
      r.bookingId.toLowerCase().includes(q),
    ).slice(0, 6);
  }, [regs, resendQuery]);

  async function resend(r: Reg) {
    setResending(r.bookingId);
    setResendMsg(null);
    try {
      const res = await fetch('/api/admin/resend-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: r.bookingId }),
      });
      const data = await res.json();
      setResendMsg({ id: r.bookingId, ok: res.ok, text: res.ok ? `Sent to ${data.sentTo}` : (data.error || 'Failed') });
    } catch {
      setResendMsg({ id: r.bookingId, ok: false, text: 'Network error' });
    } finally {
      setResending(null);
    }
  }

  return (
    <div className="min-h-[calc(100vh-56px)]" style={{ background: 'radial-gradient(ellipse at 25% 15%, #0d1f0e 0%, #050d07 55%, #020507 100%)' }}>
      <div className="max-w-3xl mx-auto px-5 py-8">

        <div className="mb-8">
          <p className="text-[10px] font-black tracking-[0.3em] uppercase text-[#c8a96e] mb-1">Registration Desk</p>
          <h1 className="text-3xl font-black text-white tracking-tight">Walk-in</h1>
          <p className="text-sm text-white/30 mt-1">Register on-spot arrivals and check them in instantly</p>
        </div>

        {/* Success — show QR */}
        {result ? (
          <div className="rounded-2xl p-7 text-center mb-6" style={{ background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.2)' }}>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-green-400/60 mb-1">Checked In ✓</p>
            <h2 className="text-2xl font-black text-white mb-1">{result.qr.name}</h2>
            <p className="text-sm text-white/40 mb-5">{result.qr.type}</p>
            <div className="inline-block bg-white p-4 rounded-2xl mb-4">
              <QRCodeCanvas value={JSON.stringify(result.qr)} size={200} level="M" />
            </div>
            <p className="font-mono text-sm text-[#c8a96e] mb-6">{result.bookingId}</p>
            <div className="flex gap-3">
              <a
                href={`/api/ticket?download=${result.bookingId}`}
                onClick={(e) => {
                  e.preventDefault();
                  fetch('/api/ticket', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId: result.bookingId, name: result.qr.name, registrationType: result.qr.type }) })
                    .then((r) => r.blob()).then((b) => { const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `ticket-${result.bookingId}.pdf`; a.click(); URL.revokeObjectURL(u); });
                }}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white/70 hover:text-white text-center"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                Download Ticket
              </a>
              <button onClick={reset} className="flex-1 py-3 rounded-xl text-sm font-black text-white"
                style={{ background: 'linear-gradient(135deg, #1a4a1a, #2e7d32)', boxShadow: '0 4px 20px rgba(46,125,50,0.4)' }}>
                New Walk-in
              </button>
            </div>
          </div>
        ) : (
          /* Form */
          <form onSubmit={submit} className="rounded-2xl p-6 mb-6 space-y-4" style={card}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1.5">Name *</label>
                <input className={input} style={inputStyle} value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Full name" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1.5">Phone *</label>
                <input className={input} style={inputStyle} value={form.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="Mobile number" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1.5">Email</label>
                <input className={input} style={inputStyle} value={form.email} onChange={(e) => setField('email', e.target.value)} placeholder="Optional" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1.5">Organization</label>
                <input className={input} style={inputStyle} value={form.organization} onChange={(e) => setField('organization', e.target.value)} placeholder="Optional" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1.5">Type</label>
                <select className={input} style={inputStyle} value={form.registrationType} onChange={(e) => setField('registrationType', e.target.value)}>
                  {REG_TYPES.map((t) => <option key={t} value={t} style={{ background: '#0a1a0c' }}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1.5">Amount Paid (₹)</label>
                <input className={input} style={inputStyle} type="number" value={form.totalAmount} onChange={(e) => setField('totalAmount', e.target.value)} placeholder="0" />
              </div>
            </div>

            <label className="flex items-center gap-2.5 text-sm text-white/50 cursor-pointer select-none">
              <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} className="w-4 h-4 accent-green-600" />
              Email the ticket too (requires email above)
            </label>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button type="submit" disabled={submitting}
              className="w-full py-3.5 rounded-xl font-black text-sm text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #1a4a1a, #2e7d32)', boxShadow: '0 4px 20px rgba(46,125,50,0.4)' }}>
              {submitting ? 'Registering…' : 'Register & Check In'}
            </button>
          </form>
        )}

        {/* Resend ticket */}
        <div className="rounded-2xl p-6" style={card}>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Lost Ticket? Resend by Email</p>
          <p className="text-xs text-white/25 mb-4">Find an existing attendee and re-send their ticket.</p>
          <input
            className={input} style={inputStyle}
            value={resendQuery}
            onChange={(e) => { setResendQuery(e.target.value); setResendMsg(null); }}
            placeholder="Search name, phone, email or booking ID…"
          />
          {matches.length > 0 && (
            <div className="space-y-2 mt-4">
              {matches.map((r) => (
                <div key={r.bookingId} className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm">{r.name}</p>
                    <p className="text-xs text-white/35 mt-0.5 truncate">{r.email || 'no email'} · {r.phone}</p>
                    {resendMsg?.id === r.bookingId && (
                      <p className="text-[11px] font-bold mt-1" style={{ color: resendMsg.ok ? '#4ade80' : '#f87171' }}>{resendMsg.text}</p>
                    )}
                  </div>
                  <button onClick={() => resend(r)} disabled={resending === r.bookingId}
                    className="flex-shrink-0 text-[10px] font-black uppercase tracking-wide px-3 py-2 rounded-lg text-white disabled:opacity-40"
                    style={{ background: 'rgba(200,169,110,0.15)', border: '1px solid rgba(200,169,110,0.3)', color: '#c8a96e' }}>
                    {resending === r.bookingId ? 'Sending…' : 'Resend'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
