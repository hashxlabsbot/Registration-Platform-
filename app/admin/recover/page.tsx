'use client';

import { useState, useEffect } from 'react';

const REGISTRATION_TYPES = [
  'Architect - IIA Member',
  'Architect - Non-IIA Member',
  'Non-Architect',
] as const;

interface LookupResult {
  paymentId:           string;
  status:              string;
  amount:              number;
  orderId:             string;
  name:                string;
  email:               string;
  phone:               string;
  organization:        string;
  designation:         string;
  district:            string;
  state:               string;
  pincode:             string;
  coaNumber:           string;
  iiaMembershipNumber: string;
  registrationType:    string;
  membersCount:        number;
}

interface Member {
  name:     string;
  relation: string;
  email:    string;
  phone:    string;
}

interface RecoveryForm {
  name:                string;
  email:               string;
  phone:               string;
  whatsapp:            string;
  gender:              string;
  nationality:         string;
  organization:        string;
  designation:         string;
  coaNumber:           string;
  iiaMembershipNumber: string;
  registrationType:    string;
  address:             string;
  district:            string;
  state:               string;
  pincode:             string;
}

interface AffectedRow {
  booking_id: string;
  name: string;
  email: string;
  phone: string;
  organization: string;
  designation: string;
  registration_type: string;
  amount: string;
}

function ArFixSection() {
  const [affected, setAffected]   = useState<AffectedRow[] | null>(null);
  const [loading, setLoading]     = useState(false);
  const [sending, setSending]     = useState(false);
  const [results, setResults]     = useState<{ bookingId: string; status: string; message: string }[]>([]);
  const [sendEmail, setSendEmail] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/fix-ar-prefix')
      .then(r => r.json())
      .then(d => setAffected(d.affected ?? []))
      .catch(() => setAffected([]))
      .finally(() => setLoading(false));
  }, []);

  async function fixAll() {
    if (!affected || affected.length === 0) return;
    setSending(true);
    setResults([]);
    const res = await fetch('/api/admin/fix-ar-prefix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingIds: affected.map(r => r.booking_id),
        sendEmail,
      }),
    });
    const data = await res.json();
    setResults(data.results ?? []);
    setSending(false);
  }

  const done = results.length > 0;

  return (
    <div
      className="rounded-2xl p-6 mb-8"
      style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.2)' }}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(251,191,36,0.15)' }}>
          <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <div>
          <p className="font-black text-yellow-300 text-sm">Fix Duplicate &ldquo;AR.&rdquo; Prefix on Tickets</p>
          <p className="text-xs text-yellow-400/60 mt-0.5">
            These architect registrants already typed &ldquo;AR.&rdquo; in their name — so their tickets were generated with &ldquo;AR. AR. NAME&rdquo;.
            This tool regenerates their PDFs with the correct name and optionally resends the ticket email.
          </p>
        </div>
      </div>

      {loading && (
        <p className="text-sm text-white/30 flex items-center gap-2">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
          </svg>
          Checking for affected tickets…
        </p>
      )}

      {!loading && affected !== null && affected.length === 0 && results.length === 0 && (
        <p className="text-sm text-green-400/70 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          No affected tickets found — all AR. prefixes look correct.
        </p>
      )}

      {!loading && affected && affected.length > 0 && !done && (
        <>
          <div
            className="rounded-xl overflow-hidden mb-4"
            style={{ border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Booking ID', 'Name (as stored)', 'Email', 'Type'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left font-black uppercase tracking-widest text-white/25">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {affected.map((r, i) => (
                  <tr
                    key={r.booking_id}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)',
                    }}
                  >
                    <td className="px-4 py-3 font-mono font-bold text-[#c8a96e]">{r.booking_id}</td>
                    <td className="px-4 py-3 text-white/80">{r.name}</td>
                    <td className="px-4 py-3 text-white/40">{r.email}</td>
                    <td className="px-4 py-3 text-white/40">{r.registration_type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={e => setSendEmail(e.target.checked)}
                className="w-4 h-4 accent-green-500 rounded"
              />
              <span className="text-sm text-white/60">Resend corrected ticket email to each attendee</span>
            </label>
            <button
              onClick={fixAll}
              disabled={sending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #9a7640, #c8a96e)', color: '#1a4a1a', boxShadow: '0 2px 12px rgba(200,169,110,0.3)' }}
            >
              {sending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                  </svg>
                  Fixing {affected.length} ticket{affected.length !== 1 ? 's' : ''}…
                </>
              ) : (
                <>Fix {affected.length} ticket{affected.length !== 1 ? 's' : ''}{sendEmail ? ' & Resend' : ''}</>
              )}
            </button>
          </div>
        </>
      )}

      {done && (
        <div className="space-y-2">
          {results.map(r => (
            <div
              key={r.bookingId}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs"
              style={{
                background: r.status === 'ok' ? 'rgba(74,222,128,0.07)' : 'rgba(239,68,68,0.07)',
                border: r.status === 'ok' ? '1px solid rgba(74,222,128,0.2)' : '1px solid rgba(239,68,68,0.2)',
              }}
            >
              {r.status === 'ok' ? (
                <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span className="font-mono font-bold" style={{ color: r.status === 'ok' ? '#4ade80' : '#f87171' }}>{r.bookingId}</span>
              <span className="text-white/50">{r.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface RegenResult {
  bookingId: string;
  status: 'ok' | 'error';
  message: string;
}

function RegenerateAllSection() {
  const [total, setTotal]         = useState<number | null>(null);
  const [running, setRunning]     = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [summary, setSummary]     = useState<{ fixed: number; failed: number; results: RegenResult[] } | null>(null);
  const [showAll, setShowAll]     = useState(false);

  useEffect(() => {
    fetch('/api/admin/regenerate-tickets')
      .then(r => r.json())
      .then(d => setTotal(d.total ?? 0))
      .catch(() => setTotal(null));
  }, []);

  async function runRegen() {
    setRunning(true);
    setSummary(null);
    try {
      const res = await fetch('/api/admin/regenerate-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendEmail }),
      });
      const data = await res.json();
      setSummary({ fixed: data.fixed, failed: data.failed, results: data.results ?? [] });
    } catch (err) {
      setSummary({ fixed: 0, failed: 1, results: [{ bookingId: '—', status: 'error', message: (err as Error).message }] });
    } finally {
      setRunning(false);
    }
  }

  const errors = summary?.results.filter(r => r.status === 'error') ?? [];

  return (
    <div
      className="rounded-2xl p-6 mb-8"
      style={{ background: 'rgba(99,179,237,0.04)', border: '1px solid rgba(99,179,237,0.18)' }}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(99,179,237,0.12)' }}>
          <svg className="w-5 h-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </div>
        <div>
          <p className="font-black text-blue-300 text-sm">Regenerate All Tickets</p>
          <p className="text-xs text-blue-400/60 mt-0.5">
            Rebuilds every stored ticket PDF using the fixed layout — corrects name/designation overlap and the double &ldquo;AR.&rdquo; prefix.
            {total !== null && (
              <span className="text-blue-300/70 font-semibold"> {total} registration{total !== 1 ? 's' : ''} in database.</span>
            )}
          </p>
        </div>
      </div>

      {!summary && (
        <>
          <div
            className="rounded-xl p-3 mb-4 text-xs"
            style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)' }}
          >
            <p className="text-red-300 font-bold mb-1">Before you run this:</p>
            <ul className="text-red-400/70 space-y-0.5 list-disc list-inside">
              <li>This overwrites every stored PDF — it cannot be undone.</li>
              <li>Only tick &ldquo;Resend email&rdquo; if you want to re-email <strong>every single attendee</strong>.</li>
              <li>Leave email unchecked to just fix the stored PDFs silently — attendees can re-download from their booking.</li>
            </ul>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={e => setSendEmail(e.target.checked)}
                className="w-4 h-4 accent-green-500 rounded"
              />
              <span className="text-sm text-white/60">Resend corrected ticket email to every attendee</span>
            </label>

            <button
              onClick={runRegen}
              disabled={running || total === null}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', color: '#fff', boxShadow: '0 2px 12px rgba(37,99,235,0.3)' }}
            >
              {running ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                  </svg>
                  Regenerating… (may take a minute)
                </>
              ) : (
                <>Regenerate {total !== null ? total : '…'} ticket{total !== 1 ? 's' : ''}</>
              )}
            </button>
          </div>
        </>
      )}

      {summary && (
        <div>
          {/* Summary bar */}
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
              style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              {summary.fixed} fixed
            </span>
            {summary.failed > 0 && (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                {summary.failed} failed
              </span>
            )}
            <button
              onClick={() => { setSummary(null); setShowAll(false); }}
              className="text-xs text-white/30 hover:text-white/60 transition ml-auto"
            >
              Run again
            </button>
          </div>

          {/* Errors only */}
          {errors.length > 0 && (
            <div className="space-y-1.5 mb-3">
              <p className="text-xs font-bold text-red-400 mb-2">Failed tickets:</p>
              {errors.map(r => (
                <div key={r.bookingId} className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs"
                  style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <span className="font-mono font-bold text-red-400">{r.bookingId}</span>
                  <span className="text-white/40">{r.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* All results (collapsible) */}
          {summary.fixed > 0 && (
            <button
              onClick={() => setShowAll(v => !v)}
              className="text-xs text-blue-400/60 hover:text-blue-300 transition"
            >
              {showAll ? 'Hide' : 'Show'} all {summary.results.length} results
            </button>
          )}
          {showAll && (
            <div className="mt-3 max-h-64 overflow-y-auto space-y-1 pr-1">
              {summary.results.map(r => (
                <div key={r.bookingId} className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs"
                  style={{
                    background: r.status === 'ok' ? 'rgba(74,222,128,0.05)' : 'rgba(239,68,68,0.07)',
                    border: r.status === 'ok' ? '1px solid rgba(74,222,128,0.12)' : '1px solid rgba(239,68,68,0.15)',
                  }}>
                  <span className="font-mono font-bold" style={{ color: r.status === 'ok' ? '#4ade80' : '#f87171' }}>{r.bookingId}</span>
                  <span className="text-white/40">{r.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RecoverPage() {
  const [paymentId,   setPaymentId]   = useState('');
  const [looking,     setLooking]     = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [lookup,      setLookup]      = useState<LookupResult | null>(null);

  const [form, setForm] = useState<RecoveryForm>({
    name: '', email: '', phone: '', whatsapp: '', gender: '', nationality: '',
    organization: '', designation: '', coaNumber: '', iiaMembershipNumber: '',
    registrationType: 'Architect - IIA Member',
    address: '', district: '', state: '', pincode: '',
  });
  const [members,     setMembers]     = useState<Member[]>([]);
  const [sendEmail,   setSendEmail]   = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success,     setSuccess]     = useState<{ bookingId: string; verifiedAmount: number; emailErrors: string[] | null } | null>(null);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setLookupError('');
    setLookup(null);
    setSuccess(null);
    if (!paymentId.trim()) return;
    setLooking(true);
    try {
      const res = await fetch('/api/admin/lookup-payment', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ paymentId: paymentId.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Lookup failed');
      setLookup(data);
      setForm(prev => ({
        ...prev,
        name:                data.name                || '',
        email:               data.email               || '',
        phone:               data.phone               || '',
        organization:        data.organization        || '',
        designation:         data.designation         || '',
        district:            data.district            || '',
        state:               data.state               || '',
        pincode:             data.pincode             || '',
        coaNumber:           data.coaNumber           || '',
        iiaMembershipNumber: data.iiaMembershipNumber || '',
        registrationType:    REGISTRATION_TYPES.includes(data.registrationType as typeof REGISTRATION_TYPES[number])
          ? data.registrationType
          : 'Architect - IIA Member',
      }));
    } catch (err) {
      setLookupError((err as Error).message);
    } finally {
      setLooking(false);
    }
  }

  function updateField(field: keyof RecoveryForm, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function addMember() {
    setMembers(prev => [...prev, { name: '', relation: '', email: '', phone: '' }]);
  }

  function removeMember(i: number) {
    setMembers(prev => prev.filter((_, idx) => idx !== i));
  }

  function updateMember(i: number, field: keyof Member, value: string) {
    setMembers(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError('');
    if (!lookup) return;
    if (!form.name || !form.email || !form.phone || !form.registrationType) {
      setSubmitError('Name, email, phone, and registration type are required.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/recover-registration', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          razorpayPaymentId: lookup.paymentId,
          ...form,
          members,
          sendEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Recovery failed');
      setSuccess({ bookingId: data.bookingId, verifiedAmount: data.verifiedAmount, emailErrors: data.emailErrors });
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setPaymentId('');
    setLookup(null);
    setLookupError('');
    setSuccess(null);
    setSubmitError('');
    setForm({
      name: '', email: '', phone: '', whatsapp: '', gender: '', nationality: '',
      organization: '', designation: '', coaNumber: '', iiaMembershipNumber: '',
      registrationType: 'Architect - IIA Member',
      address: '', district: '', state: '', pincode: '',
    });
    setMembers([]);
    setSendEmail(true);
  }

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at 25% 15%, #0d1f0e 0%, #050d07 55%, #020507 100%)' }}>
      <div className="max-w-3xl mx-auto px-5 py-8">

        {/* Header */}
        <div className="mb-8">
          <p className="text-[10px] font-black tracking-[0.3em] uppercase text-[#c8a96e] mb-1">Recovery Tool</p>
          <h1 className="text-2xl font-black text-white tracking-tight">Recover Missing Registration</h1>
          <p className="text-sm text-white/30 mt-1">
            For users who paid via Razorpay but have no entry in the database.
            Enter their Razorpay payment ID to look up payment details, fill in any missing info, then create the registration and send the ticket.
          </p>
        </div>

        {/* ── Bulk AR. prefix fix ─────────────────────────────────────────── */}
        <ArFixSection />

        {/* ── Regenerate all stored PDFs ──────────────────────────────────── */}
        <RegenerateAllSection />

        {/* Success screen */}
        {success && (
          <div
            className="rounded-2xl p-6 mb-6"
            style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(74,222,128,0.15)' }}>
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-black text-green-400 text-lg">Registration Recovered</p>
                <p className="text-sm text-white/50">Booking created and ticket emailed successfully.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <InfoBox label="Booking ID" value={success.bookingId} mono />
              <InfoBox label="Amount Verified" value={`₹${success.verifiedAmount.toLocaleString('en-IN')}`} />
            </div>
            {success.emailErrors && success.emailErrors.length > 0 && (
              <div className="rounded-xl p-3 mb-4" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
                <p className="text-xs font-bold text-yellow-400 mb-1">Email delivery warnings:</p>
                {success.emailErrors.map((e, i) => (
                  <p key={i} className="text-xs text-yellow-300/70">{e}</p>
                ))}
              </div>
            )}
            <button
              onClick={reset}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              Recover Another
            </button>
          </div>
        )}

        {!success && (
          <>
            {/* Step 1: Lookup */}
            <div
              className="rounded-2xl p-6 mb-5"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c8a96e] mb-4">Step 1 — Razorpay Payment ID</p>
              <form onSubmit={handleLookup} className="flex gap-3">
                <input
                  type="text"
                  value={paymentId}
                  onChange={e => setPaymentId(e.target.value.trim())}
                  placeholder="pay_XXXXXXXXXXXXXXXXXX"
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white font-mono placeholder-white/20 outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <button
                  type="submit"
                  disabled={looking || !paymentId.trim()}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #1a4a1a, #2e7d32)' }}
                >
                  {looking ? 'Looking up…' : 'Lookup'}
                </button>
              </form>
              {lookupError && (
                <p className="mt-3 text-sm text-red-400">{lookupError}</p>
              )}
              {lookup && (
                <div className="mt-4 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-3" style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)' }}>
                  <InfoBox label="Payment ID" value={lookup.paymentId} mono />
                  <InfoBox label="Status" value={lookup.status.toUpperCase()} valueColor="#4ade80" />
                  <InfoBox label="Amount" value={`₹${lookup.amount.toLocaleString('en-IN')}`} />
                  {lookup.name             && <InfoBox label="Name"                value={lookup.name} />}
                  {lookup.email            && <InfoBox label="Email"               value={lookup.email} />}
                  {lookup.phone            && <InfoBox label="Phone"               value={lookup.phone} />}
                  {lookup.registrationType && <InfoBox label="Reg. Type"    value={lookup.registrationType} />}
                  {lookup.organization     && <InfoBox label="Organization" value={lookup.organization} />}
                  {lookup.designation      && <InfoBox label="Designation"  value={lookup.designation} />}
                  {lookup.district         && <InfoBox label="District"     value={lookup.district} />}
                  {lookup.state            && <InfoBox label="State"               value={lookup.state} />}
                  {lookup.pincode          && <InfoBox label="Pincode"             value={lookup.pincode} />}
                  {lookup.coaNumber        && <InfoBox label="COA No."             value={lookup.coaNumber} />}
                  {lookup.iiaMembershipNumber && <InfoBox label="IIA Membership"  value={lookup.iiaMembershipNumber} />}
                  {lookup.membersCount > 0 && (
                    <InfoBox label="Members" value={`${lookup.membersCount} additional`} />
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Fill in details */}
            {lookup && (
              <form onSubmit={handleSubmit}>
                <div
                  className="rounded-2xl p-6 mb-5"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c8a96e] mb-5">Step 2 — Registration Details</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <F label="Full Name" value={form.name} onChange={v => updateField('name', v)} required placeholder="Rahul Vashisth" />
                    </div>
                    <F label="Email" type="email" value={form.email} onChange={v => updateField('email', v)} required placeholder="user@example.com" />
                    <F label="Phone (10 digits)" value={form.phone} onChange={v => updateField('phone', v)} required placeholder="9876543210" />
                    <F label="WhatsApp (optional)" value={form.whatsapp} onChange={v => updateField('whatsapp', v)} placeholder="9876543210" />

                    {/* Gender */}
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">Gender</label>
                      <div className="flex gap-4">
                        {['Male', 'Female', 'Other'].map(g => (
                          <label key={g} className="flex items-center gap-1.5 text-sm text-white/60 cursor-pointer">
                            <input
                              type="radio" name="gender" value={g}
                              checked={form.gender === g}
                              onChange={() => updateField('gender', g)}
                              className="accent-green-500"
                            />
                            {g}
                          </label>
                        ))}
                      </div>
                    </div>

                    <F label="Nationality" value={form.nationality} onChange={v => updateField('nationality', v)} placeholder="Indian" />
                    <F label="Firm / Organization" value={form.organization} onChange={v => updateField('organization', v)} placeholder="Firm Name" />
                    <F label="Designation" value={form.designation} onChange={v => updateField('designation', v)} placeholder="Principal Architect" />

                    {/* Registration type */}
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">Registration Type <span className="text-red-400">*</span></label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {REGISTRATION_TYPES.map(t => (
                          <label
                            key={t}
                            className="flex items-center gap-2 rounded-xl px-4 py-2.5 cursor-pointer transition"
                            style={form.registrationType === t
                              ? { background: 'rgba(46,125,50,0.2)', border: '1px solid rgba(74,222,128,0.3)' }
                              : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                          >
                            <input
                              type="radio" name="registrationType" value={t}
                              checked={form.registrationType === t}
                              onChange={() => updateField('registrationType', t)}
                              className="accent-green-500"
                            />
                            <span className="text-xs font-semibold text-white/70">{t}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {(form.registrationType === 'Architect - IIA Member' || form.registrationType === 'Architect - Non-IIA Member') && (
                      <>
                        <F label="COA Number" value={form.coaNumber} onChange={v => updateField('coaNumber', v)} placeholder="CA/XXXX/XXXX" />
                        {form.registrationType === 'Architect - IIA Member' && (
                          <F label="IIA Membership No." value={form.iiaMembershipNumber} onChange={v => updateField('iiaMembershipNumber', v)} placeholder="IIA/XXXX/XXXX" />
                        )}
                      </>
                    )}

                    <F label="District" value={form.district} onChange={v => updateField('district', v)} placeholder="Faridabad" />
                    <F label="State" value={form.state} onChange={v => updateField('state', v)} placeholder="Haryana" />
                    <F label="Pincode" value={form.pincode} onChange={v => updateField('pincode', v)} placeholder="121001" maxLength={6} />
                  </div>

                  {/* Additional members */}
                  {(form.registrationType === 'Architect - IIA Member' || form.registrationType === 'Architect - Non-IIA Member') && (
                    <div className="mt-5 rounded-xl p-4" style={{ background: 'rgba(200,169,110,0.05)', border: '1px solid rgba(200,169,110,0.12)' }}>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-[#c8a96e]">Additional Members</p>
                        <button
                          type="button"
                          onClick={addMember}
                          className="text-xs font-bold text-[#c8a96e] px-3 py-1.5 rounded-lg transition"
                          style={{ background: 'rgba(200,169,110,0.1)', border: '1px solid rgba(200,169,110,0.2)' }}
                        >
                          + Add Member
                        </button>
                      </div>
                      {members.length === 0 && (
                        <p className="text-xs text-white/25 text-center py-2">No additional members. Add if the primary attendee had companions.</p>
                      )}
                      {members.map((m, i) => (
                        <div key={i} className="rounded-xl p-4 mb-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div className="flex justify-between items-center mb-3">
                            <p className="text-xs font-bold text-white/50">Member {i + 1}</p>
                            <button type="button" onClick={() => removeMember(i)} className="text-xs text-red-400 hover:text-red-300 font-semibold">Remove</button>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <F label="Name" value={m.name} onChange={v => updateMember(i, 'name', v)} placeholder="Member name" />
                            <div>
                              <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">Relation</label>
                              <select
                                value={m.relation}
                                onChange={e => updateMember(i, 'relation', e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                              >
                                <option value="">Select</option>
                                <option value="Spouse">Spouse</option>
                                <option value="Friend">Friend</option>
                              </select>
                            </div>
                            <F label="Email" type="email" value={m.email} onChange={v => updateMember(i, 'email', v)} placeholder="member@example.com" />
                            <F label="Phone" value={m.phone} onChange={v => updateMember(i, 'phone', v)} placeholder="9876543210" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Step 3: Submit */}
                <div
                  className="rounded-2xl p-6"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c8a96e] mb-4">Step 3 — Confirm & Submit</p>

                  <div
                    className="rounded-xl p-4 mb-4"
                    style={{ background: 'rgba(255,193,7,0.06)', border: '1px solid rgba(255,193,7,0.15)' }}
                  >
                    <p className="text-xs font-bold text-yellow-400 mb-1">Before submitting:</p>
                    <ul className="text-xs text-yellow-300/70 space-y-0.5 list-disc list-inside">
                      <li>The payment will be re-verified with Razorpay before creating the entry.</li>
                      <li>If a registration with this payment ID already exists, the operation will fail.</li>
                      <li>Confirm all details with the attendee before proceeding.</li>
                    </ul>
                  </div>

                  <label className="flex items-center gap-3 mb-5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendEmail}
                      onChange={e => setSendEmail(e.target.checked)}
                      className="w-4 h-4 accent-green-500 rounded"
                    />
                    <span className="text-sm text-white/70">Send ticket email to the attendee</span>
                  </label>

                  {submitError && (
                    <div className="rounded-xl px-4 py-3 mb-4 flex items-start gap-2.5" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                      </svg>
                      <p className="text-sm text-red-400">{submitError}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 rounded-xl text-base font-bold text-white transition disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #1a4a1a, #2e7d32)', boxShadow: '0 4px 24px rgba(46,125,50,0.3)' }}
                  >
                    {submitting ? 'Creating Registration…' : 'Create Registration & Send Ticket'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function F({
  label, type = 'text', value, onChange, placeholder, required, maxLength,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void;
  placeholder?: string; required?: boolean; maxLength?: number;
}) {
  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-white/20 outline-none transition"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
      />
    </div>
  );
}

function InfoBox({ label, value, mono, valueColor }: {
  label: string; value: string; mono?: boolean; valueColor?: string;
}) {
  return (
    <div>
      <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-0.5">{label}</p>
      <p className={`text-xs font-bold ${mono ? 'font-mono' : ''}`} style={{ color: valueColor ?? 'rgba(255,255,255,0.75)' }}>
        {value}
      </p>
    </div>
  );
}
