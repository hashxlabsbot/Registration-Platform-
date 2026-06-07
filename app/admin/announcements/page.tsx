'use client';

import { useState, useEffect } from 'react';

type RecipientFilter = 'all' | 'checked_in' | 'pending' | 'architect_iia' | 'architect_non_iia' | 'non_architect' | 'special_invitee';

interface Registration {
  registrationType: string;
  checkedIn: boolean;
}

const FILTER_OPTIONS: { value: RecipientFilter; label: string; description: string }[] = [
  { value: 'all',              label: 'All Registrants',    description: 'Everyone who registered' },
  { value: 'checked_in',       label: 'Checked In',         description: 'Attendees who have arrived' },
  { value: 'pending',          label: 'Not Checked In',     description: 'Registered but not yet arrived' },
  { value: 'architect_iia',    label: 'IIA Members',        description: 'Architect – IIA Member' },
  { value: 'architect_non_iia',label: 'Non-IIA Architects', description: 'Architect – Non-IIA Member' },
  { value: 'non_architect',    label: 'Delegates',          description: 'Non-Architect / Delegate' },
  { value: 'special_invitee',  label: 'Special Invitees',   description: 'Special Invitee registrations' },
];

export default function AnnouncementsPage() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [recipientFilter, setRecipientFilter] = useState<RecipientFilter>('all');
  const [regs, setRegs] = useState<Registration[]>([]);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/registrations')
      .then((r) => r.json())
      .then((d) => setRegs(d.registrations ?? []));
  }, []);

  function previewCount(): number {
    if (recipientFilter === 'all')              return regs.length;
    if (recipientFilter === 'checked_in')       return regs.filter((r) => r.checkedIn).length;
    if (recipientFilter === 'pending')          return regs.filter((r) => !r.checkedIn).length;
    if (recipientFilter === 'architect_iia')    return regs.filter((r) => r.registrationType.toLowerCase().includes('iia member')).length;
    if (recipientFilter === 'architect_non_iia') return regs.filter((r) => r.registrationType.toLowerCase().includes('non-iia') || r.registrationType.toLowerCase().includes('non iia')).length;
    if (recipientFilter === 'non_architect')    return regs.filter((r) => r.registrationType.toLowerCase().includes('non-architect') || r.registrationType.toLowerCase().includes('non architect') || r.registrationType.toLowerCase() === 'delegate').length;
    if (recipientFilter === 'special_invitee')  return regs.filter((r) => r.registrationType.toLowerCase().includes('special')).length;
    return 0;
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    if (!confirm(`Send announcement to ${previewCount()} recipients?`)) return;

    setError('');
    setResult(null);
    setSending(true);
    try {
      const res = await fetch('/api/admin/send-announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message, recipients: recipientFilter }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to send.');
      } else {
        setResult(data);
        setSubject('');
        setMessage('');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSending(false);
    }
  }

  const count = previewCount();

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at 25% 15%, #0d1f0e 0%, #050d07 55%, #020507 100%)' }}>
      <div className="max-w-4xl mx-auto px-5 py-8">

        {/* Header */}
        <div className="mb-8">
          <p className="text-[10px] font-black tracking-[0.3em] uppercase text-[#c8a96e] mb-1">Event Management</p>
          <h1 className="text-3xl font-black text-white tracking-tight">Announcements</h1>
          <p className="text-sm text-white/30 mt-1">Send bulk email notifications to registered attendees</p>
        </div>

        {/* Success result */}
        {result && (
          <div className="mb-6 rounded-2xl px-5 py-4 flex items-start gap-3"
            style={{ background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.18)' }}>
            <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-bold text-green-400 text-sm">Announcement sent!</p>
              <p className="text-xs text-white/50 mt-0.5">
                {result.sent} delivered · {result.failed > 0 ? `${result.failed} failed · ` : ''}{result.total} total recipients
              </p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">

          {/* Compose form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSend} className="space-y-5">
              <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4">Compose Message</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-white/35 mb-2">Subject</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Important update about Prakriti 2026"
                      required
                      className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                      onFocus={(e) => { e.target.style.border = '1px solid rgba(200,169,110,0.35)'; }}
                      onBlur={(e) => { e.target.style.border = '1px solid rgba(255,255,255,0.08)'; }}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-white/35 mb-2">Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Write your announcement here…"
                      required
                      rows={8}
                      className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all resize-y"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                      onFocus={(e) => { e.target.style.border = '1px solid rgba(200,169,110,0.35)'; }}
                      onBlur={(e) => { e.target.style.border = '1px solid rgba(255,255,255,0.08)'; }}
                    />
                    <p className="text-[10px] text-white/25 mt-1.5">{message.length} characters</p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-xs text-red-300"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
                  <svg className="w-4 h-4 flex-shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={sending || !subject.trim() || !message.trim() || count === 0}
                className="w-full py-4 rounded-xl font-black text-sm tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #1a4a1a 0%, #2e7d32 100%)', color: '#fff', boxShadow: '0 4px 20px rgba(46,125,50,0.35)' }}
              >
                {sending ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sending…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                    Send to {count} recipient{count !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Recipient filter */}
          <div>
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4">Recipients</p>
              <div className="space-y-2">
                {FILTER_OPTIONS.map((opt) => {
                  const optCount = (() => {
                    if (opt.value === 'all')              return regs.length;
                    if (opt.value === 'checked_in')       return regs.filter((r) => r.checkedIn).length;
                    if (opt.value === 'pending')          return regs.filter((r) => !r.checkedIn).length;
                    if (opt.value === 'architect_iia')    return regs.filter((r) => r.registrationType.toLowerCase().includes('iia member')).length;
                    if (opt.value === 'architect_non_iia') return regs.filter((r) => r.registrationType.toLowerCase().includes('non-iia') || r.registrationType.toLowerCase().includes('non iia')).length;
                    if (opt.value === 'non_architect')    return regs.filter((r) => r.registrationType.toLowerCase().includes('non-architect') || r.registrationType.toLowerCase().includes('non architect') || r.registrationType.toLowerCase() === 'delegate').length;
                    if (opt.value === 'special_invitee')  return regs.filter((r) => r.registrationType.toLowerCase().includes('special')).length;
                    return 0;
                  })();

                  const active = recipientFilter === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setRecipientFilter(opt.value)}
                      className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left transition-all"
                      style={active
                        ? { background: 'linear-gradient(135deg, rgba(26,74,26,0.6), rgba(46,125,50,0.4))', border: '1px solid rgba(74,222,128,0.2)' }
                        : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <div>
                        <p className={`text-xs font-bold ${active ? 'text-white' : 'text-white/60'}`}>{opt.label}</p>
                        <p className="text-[10px] text-white/30 mt-0.5">{opt.description}</p>
                      </div>
                      <span className="text-xs font-black ml-3 flex-shrink-0" style={{ color: active ? '#4ade80' : 'rgba(255,255,255,0.25)' }}>
                        {optCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
