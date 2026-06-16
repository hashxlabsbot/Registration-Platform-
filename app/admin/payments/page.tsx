'use client';

import { useState, useEffect, useMemo } from 'react';

interface Registration {
  bookingId: string;
  name: string;
  email: string;
  phone: string;
  registrationType: string;
  amount: number;
  utrNumber: string;
  registeredAt: string;
}

type PaymentType = 'all' | 'online' | 'transfer' | 'invite' | 'manual';

function classifyPayment(utr: string): 'online' | 'transfer' | 'invite' | 'manual' {
  if (!utr) return 'manual';
  if (utr.toLowerCase().startsWith('pay_')) return 'online';
  if (utr.toUpperCase() === 'INVITE') return 'invite';
  if (/^\d{12,}$/.test(utr)) return 'transfer'; // UTR numbers are typically 12+ digits
  return 'manual';
}

const TYPE_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  online:   { label: 'Razorpay',      color: '#63b3ed', bg: 'rgba(99,179,237,0.1)',   border: 'rgba(99,179,237,0.2)' },
  transfer: { label: 'Bank Transfer', color: '#c8a96e', bg: 'rgba(200,169,110,0.1)',  border: 'rgba(200,169,110,0.2)' },
  invite:   { label: 'Invite / Free', color: '#4ade80', bg: 'rgba(74,222,128,0.1)',   border: 'rgba(74,222,128,0.2)' },
  manual:   { label: 'Manual',        color: '#a78bfa', bg: 'rgba(167,139,250,0.1)',  border: 'rgba(167,139,250,0.2)' },
};

export default function PaymentsPage() {
  const [regs, setRegs] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PaymentType>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/admin/registrations')
      .then((r) => r.json())
      .then((d) => setRegs(d.registrations ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = regs;
    if (filter !== 'all') list = list.filter((r) => classifyPayment(r.utrNumber) === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.utrNumber.toLowerCase().includes(q) ||
        r.bookingId.toLowerCase().includes(q),
      );
    }
    return list;
  }, [regs, filter, search]);

  const totalRevenue = regs.reduce((s, r) => s + r.amount, 0);
  const onlineRevenue = regs.filter((r) => classifyPayment(r.utrNumber) === 'online').reduce((s, r) => s + r.amount, 0);
  const transferRevenue = regs.filter((r) => classifyPayment(r.utrNumber) === 'transfer').reduce((s, r) => s + r.amount, 0);
  const counts = { online: 0, transfer: 0, invite: 0, manual: 0 };
  regs.forEach((r) => counts[classifyPayment(r.utrNumber)]++);

  const filterOptions: { value: PaymentType; label: string }[] = [
    { value: 'all',      label: `All (${regs.length})` },
    { value: 'online',   label: `Razorpay (${counts.online})` },
    { value: 'transfer', label: `Bank (${counts.transfer})` },
    { value: 'invite',   label: `Invite (${counts.invite})` },
    { value: 'manual',   label: `Manual (${counts.manual})` },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at 25% 15%, #0d1f0e 0%, #050d07 55%, #020507 100%)' }}>
      <div className="max-w-7xl mx-auto px-5 py-8">

        {/* Header */}
        <div className="mb-8">
          <p className="text-[10px] font-black tracking-[0.3em] uppercase text-[#c8a96e] mb-1">Event Management</p>
          <h1 className="text-3xl font-black text-white tracking-tight">Payment Logs</h1>
          <p className="text-sm text-white/30 mt-1">All payment records across registration types</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Revenue',    value: `₹${totalRevenue.toLocaleString('en-IN')}`,   color: '#c8a96e' },
            { label: 'Online Payments',  value: `₹${onlineRevenue.toLocaleString('en-IN')}`,  color: '#63b3ed' },
            { label: 'Bank Transfers',   value: `₹${transferRevenue.toLocaleString('en-IN')}`, color: '#fbbf24' },
            { label: 'Free / Invite',    value: counts.invite,                                  color: '#4ade80' },
          ].map((c) => (
            <div key={c.label} className="rounded-2xl px-4 py-4"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-xl font-black" style={{ color: c.color }}>{c.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mt-1">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-52">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
              <svg className="w-4 h-4 text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <input type="search" placeholder="Search name, email, booking ID or payment ref…"
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              onFocus={(e) => { e.target.style.border = '1px solid rgba(200,169,110,0.35)'; }}
              onBlur={(e) => { e.target.style.border = '1px solid rgba(255,255,255,0.08)'; }}
            />
          </div>

          <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            {filterOptions.map((f) => (
              <button key={f.value} onClick={() => setFilter(f.value)}
                className="px-3 py-2.5 text-xs font-bold transition-all whitespace-nowrap"
                style={filter === f.value
                  ? { background: 'linear-gradient(135deg, #1a4a1a, #2e7d32)', color: '#fff' }
                  : { background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.35)' }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {loading ? (
            <div className="py-24 flex flex-col items-center gap-4">
              <div className="w-9 h-9 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: 'rgba(46,125,50,0.4)', borderTopColor: '#2e7d32' }} />
              <p className="text-sm text-white/25">Loading payments…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-sm text-white/25">No matching payment records.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-white/25">Booking ID</th>
                    <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-white/25">Attendee</th>
                    <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-white/25">Type</th>
                    <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-white/25">Amount</th>
                    <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-white/25 hidden md:table-cell">Payment Ref</th>
                    <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-white/25 hidden md:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => {
                    const pType = classifyPayment(r.utrNumber);
                    const badge = TYPE_LABELS[pType];
                    return (
                      <tr key={r.bookingId}
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)' }}>
                        <td className="px-5 py-4 font-mono text-xs font-bold" style={{ color: '#c8a96e' }}>{r.bookingId}</td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-white text-sm">{r.name}</p>
                          <p className="text-xs text-white/30">{r.email}</p>
                          {/* Mobile subtext details */}
                          <div className="mt-1 space-y-0.5 md:hidden text-[10px]">
                            <p className="text-white/35 font-mono">Ref: {r.utrNumber || '—'}</p>
                            <p className="text-white/20">{r.registeredAt}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-block text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full"
                            style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-bold text-white/75">
                            {r.amount > 0 ? `₹${r.amount.toLocaleString('en-IN')}` : <span className="text-white/30">—</span>}
                          </span>
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell">
                          {r.utrNumber ? (
                            <div>
                              <span className="font-mono text-xs text-white/50">{r.utrNumber}</span>
                              {pType === 'online' && (
                                <a
                                  href={`https://dashboard.razorpay.com/app/payments/${r.utrNumber}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-2 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
                                  style={{ background: 'rgba(99,179,237,0.1)', color: '#63b3ed', border: '1px solid rgba(99,179,237,0.2)' }}
                                >
                                  View ↗
                                </a>
                              )}
                            </div>
                          ) : <span className="text-white/20">—</span>}
                        </td>
                        <td className="px-5 py-4 text-xs text-white/25 hidden md:table-cell">{r.registeredAt}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="px-5 py-3.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-xs text-white/25">
                  Showing <span className="text-white/50 font-bold">{filtered.length}</span> of{' '}
                  <span className="text-white/50 font-bold">{regs.length}</span> records
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
