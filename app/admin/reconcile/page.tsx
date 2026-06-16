'use client';

import { useState, useMemo } from 'react';

interface UnmatchedPayment {
  paymentId: string;
  orderId: string;
  amount: number;
  email: string;
  name: string;
  phone: string;
  organization: string;
  designation: string;
  registrationType: string;
  district: string;
  state: string;
  coaNumber: string;
  iiaMembershipNumber: string;
  membersCount: number;
  createdAt: string;
  alreadyRegistered: boolean;
}

interface AuditResult {
  totalCaptured: number;
  inDb: number;
  unmatchedCount: number;
  unmatched: UnmatchedPayment[];
}

type RowStatus = 'idle' | 'loading' | 'done' | 'error' | 'skipped';

export default function ReconcilePage() {
  const [audit, setAudit]     = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const [rowStatus,  setRowStatus]  = useState<Record<string, RowStatus>>({});
  const [rowMessage, setRowMessage] = useState<Record<string, string>>({});

  async function runAudit() {
    setLoading(true);
    setError('');
    setAudit(null);
    setRowStatus({});
    setRowMessage({});
    try {
      const res = await fetch('/api/admin/payment-audit');
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Audit failed');
      }
      setAudit(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function recover(p: UnmatchedPayment) {
    setRowStatus((s) => ({ ...s, [p.paymentId]: 'loading' }));
    setRowMessage((s) => ({ ...s, [p.paymentId]: '' }));
    try {
      const res = await fetch('/api/admin/recover-registration', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpayPaymentId:   p.paymentId,
          name:                p.name,
          email:               p.email,
          phone:               p.phone,
          organization:        p.organization,
          designation:         p.designation,
          registrationType:    p.registrationType || 'Non-Architect',
          totalAmount:         p.amount,
          district:            p.district,
          state:               p.state,
          coaNumber:           p.coaNumber,
          iiaMembershipNumber: p.iiaMembershipNumber,
          sendEmail:           true,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? 'Recovery failed');
      setRowStatus((s)  => ({ ...s, [p.paymentId]: 'done' }));
      setRowMessage((s) => ({ ...s, [p.paymentId]: `Booking ID: ${d.bookingId}` }));
    } catch (e: unknown) {
      setRowStatus((s)  => ({ ...s, [p.paymentId]: 'error' }));
      setRowMessage((s) => ({ ...s, [p.paymentId]: e instanceof Error ? e.message : 'Failed' }));
    }
  }

  function skip(paymentId: string) {
    setRowStatus((s)  => ({ ...s, [paymentId]: 'skipped' }));
    setRowMessage((s) => ({ ...s, [paymentId]: 'Marked as test / skipped' }));
  }

  // Emails that are flagged as duplicate:
  // 1. Already registered in DB under a different payment (alreadyRegistered flag from API)
  // 2. OR appear more than once within the unmatched list itself
  const duplicateEmails = useMemo(() => {
    if (!audit) return new Set<string>();
    const dupes = new Set<string>();
    // Case 1: email already in DB
    for (const p of audit.unmatched) {
      if (p.alreadyRegistered) dupes.add(p.email.toLowerCase());
    }
    // Case 2: same email appears twice in unmatched list
    const counts: Record<string, number> = {};
    for (const p of audit.unmatched) {
      const key = p.email.toLowerCase();
      counts[key] = (counts[key] ?? 0) + 1;
    }
    for (const [email, count] of Object.entries(counts)) {
      if (count > 1) dupes.add(email);
    }
    return dupes;
  }, [audit]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const visibleRows = audit?.unmatched.filter(
    (p) => rowStatus[p.paymentId] !== 'skipped',
  ) ?? [];

  const activeCount = visibleRows.filter(
    (p) => rowStatus[p.paymentId] !== 'done',
  ).length;

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at 25% 15%, #0d1f0e 0%, #050d07 55%, #020507 100%)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-5 py-8">

        {/* Header */}
        <div className="mb-8">
          <p className="text-[10px] font-black tracking-[0.3em] uppercase text-[#c8a96e] mb-1">Payment Reconciliation</p>
          <h1 className="text-3xl font-black text-white tracking-tight">Payment Audit</h1>
          <p className="text-sm text-white/30 mt-1">
            Fetches all captured Razorpay payments from <strong className="text-white/60">5th June 2026</strong> onwards (₹500 intervals) and finds who paid but has no registration in the database.
          </p>
        </div>

        {/* Run button */}
        <button
          onClick={runAudit}
          disabled={loading}
          className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
          style={{
            background: loading ? 'rgba(200,169,110,0.15)' : 'linear-gradient(135deg, #9a7640, #c8a96e)',
            color: loading ? '#c8a96e' : '#1a4a1a',
            boxShadow: loading ? 'none' : '0 2px 16px rgba(200,169,110,0.3)',
          }}
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
              </svg>
              Fetching all Razorpay payments…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              {audit ? 'Re-run Audit' : 'Run Payment Audit'}
            </>
          )}
        </button>

        {error && (
          <div className="mt-4 px-4 py-3 rounded-xl text-sm text-red-300" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </div>
        )}

        {audit && (
          <>
            {/* Summary cards */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <SummaryCard label="Total Captured"  value={audit.totalCaptured}  color="#63b3ed" />
              <SummaryCard label="In Database"     value={audit.inDb}           color="#4ade80" />
              <SummaryCard label="Missing"         value={audit.unmatchedCount} color={audit.unmatchedCount > 0 ? '#f87171' : '#4ade80'} />
              <SummaryCard label="Still Pending"   value={activeCount}          color={activeCount > 0 ? '#fbbf24' : '#4ade80'} />
            </div>

            {/* Duplicate email warning */}
            {duplicateEmails.size > 0 && (
              <div
                className="mb-5 px-4 py-3 rounded-xl text-sm flex items-start gap-3"
                style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}
              >
                <svg className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <div>
                  <p className="text-yellow-300 font-bold">Duplicate payments detected</p>
                  <p className="text-yellow-400/70 text-xs mt-0.5">
                    {[...duplicateEmails].join(', ')} —{' '}
                    already have a registration in the database (likely paid twice or did a test payment).
                    Use <strong>Skip</strong> on this entry — <strong>do not register again</strong>.
                  </p>
                </div>
              </div>
            )}

            {audit.unmatchedCount === 0 ? (
              <div
                className="rounded-2xl px-6 py-8 text-center"
                style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)' }}
              >
                <svg className="w-10 h-10 text-green-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-green-400 font-bold text-sm">All payments are accounted for!</p>
                <p className="text-white/30 text-xs mt-1">Every captured Razorpay payment has a matching registration in the database.</p>
              </div>
            ) : (
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                {/* Table header */}
                <div
                  className="px-5 py-3 flex flex-wrap items-center justify-between gap-2"
                  style={{ background: 'rgba(239,68,68,0.06)', borderBottom: '1px solid rgba(239,68,68,0.12)' }}
                >
                  <p className="text-xs font-black uppercase tracking-widest text-red-400">
                    {audit.unmatchedCount} payment{audit.unmatchedCount !== 1 ? 's' : ''} missing from database
                  </p>
                  <p className="text-xs text-white/30">Skip test payments · then Register &amp; Send Ticket for real ones</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/25">Payment ID</th>
                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/25 hidden md:table-cell">Paid At</th>
                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/25">Name / Email</th>
                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/25 hidden lg:table-cell">Phone</th>
                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/25 hidden sm:table-cell">Type</th>
                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/25">Amount</th>
                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/25">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {audit.unmatched.map((p, i) => {
                        const status = rowStatus[p.paymentId] ?? 'idle';
                        const msg    = rowMessage[p.paymentId] ?? '';
                        if (status === 'skipped') return null;

                        const isDone = status === 'done';
                        const isDupe = duplicateEmails.has(p.email.toLowerCase());

                        return (
                          <tr
                            key={p.paymentId}
                            style={{
                              borderBottom: '1px solid rgba(255,255,255,0.04)',
                              background: isDone
                                ? 'rgba(74,222,128,0.04)'
                                : isDupe
                                  ? 'rgba(251,191,36,0.04)'
                                  : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)',
                            }}
                          >
                            {/* Payment ID — always visible */}
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {isDupe && (
                                  <span
                                    title={p.alreadyRegistered ? 'This email already has a registration in the DB — likely a test payment' : 'Same email appears multiple times in this list'}
                                    className="text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                                    style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)' }}
                                  >
                                    {p.alreadyRegistered ? 'REG' : 'DUP'}
                                  </span>
                                )}
                                <span className="font-mono text-xs font-bold text-[#c8a96e] break-all">{p.paymentId}</span>
                              </div>
                              {/* Paid at — mobile only */}
                              <p className="text-[10px] text-white/30 mt-0.5 md:hidden">{formatDate(p.createdAt)}</p>
                            </td>

                            {/* Paid At — desktop only */}
                            <td className="px-4 py-4 text-xs text-white/35 whitespace-nowrap hidden md:table-cell">
                              {formatDate(p.createdAt)}
                            </td>

                            {/* Name / Email — always visible */}
                            <td className="px-4 py-4">
                              <p className="text-sm font-semibold text-white leading-snug">
                                {p.name || <span className="text-white/25 italic">—</span>}
                              </p>
                              <p className="text-xs text-white/35 mt-0.5 break-all">{p.email}</p>
                              {/* Phone + type — mobile only */}
                              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 lg:hidden">
                                {p.phone && <p className="text-[10px] text-white/30">{p.phone}</p>}
                                {p.registrationType && (
                                  <p className="text-[10px] text-green-400/60 sm:hidden">
                                    {p.registrationType === 'Non-Architect' || p.registrationType === 'Non - Architect' ? 'Delegate' : p.registrationType}
                                  </p>
                                )}
                              </div>
                            </td>

                            {/* Phone — lg+ only */}
                            <td className="px-4 py-4 text-xs text-white/40 hidden lg:table-cell">{p.phone || '—'}</td>

                            {/* Type — sm+ only */}
                            <td className="px-4 py-4 hidden sm:table-cell">
                              {p.registrationType ? (
                                <span
                                  className="text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded-full whitespace-nowrap"
                                  style={{ background: 'rgba(46,125,50,0.18)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }}
                                >
                                  {p.registrationType === 'Non-Architect' || p.registrationType === 'Non - Architect'
                                    ? 'Delegate' : p.registrationType}
                                </span>
                              ) : (
                                <span className="text-white/25 text-xs italic">unknown</span>
                              )}
                            </td>

                            {/* Amount — always visible */}
                            <td className="px-4 py-4">
                              <span className="text-sm font-bold text-white/75">₹{p.amount.toLocaleString('en-IN')}</span>
                            </td>

                            {/* Actions — always visible */}
                            <td className="px-4 py-4">
                              {isDone ? (
                                <div>
                                  <span
                                    className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide px-2.5 py-1.5 rounded-lg"
                                    style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }}
                                  >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                    Sent
                                  </span>
                                  {msg && <p className="text-[10px] text-green-400/70 mt-1 font-mono">{msg}</p>}
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 flex-wrap">
                                  {/* Register & Send */}
                                  <button
                                    onClick={() => recover(p)}
                                    disabled={status === 'loading'}
                                    className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-50"
                                    style={{ background: 'rgba(200,169,110,0.12)', color: '#c8a96e', border: '1px solid rgba(200,169,110,0.2)' }}
                                  >
                                    {status === 'loading' ? (
                                      <>
                                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                                        </svg>
                                        Sending…
                                      </>
                                    ) : (
                                      <>
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                        </svg>
                                        {status === 'error' ? 'Retry' : 'Register & Send'}
                                      </>
                                    )}
                                  </button>

                                  {/* Skip */}
                                  <button
                                    onClick={() => skip(p.paymentId)}
                                    disabled={status === 'loading'}
                                    title="Mark as test / skip — won't register this payment"
                                    className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide px-2 py-1.5 rounded-lg transition-all disabled:opacity-50"
                                    style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}
                                  >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Skip
                                  </button>

                                  {/* Error message */}
                                  {status === 'error' && msg && (
                                    <p className="w-full text-[10px] text-red-400/70 mt-0.5 break-words">{msg}</p>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="rounded-2xl px-5 py-4"
      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">{label}</p>
      <p className="text-3xl font-black" style={{ color }}>{value}</p>
    </div>
  );
}
