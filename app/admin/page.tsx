'use client';

import { useState, useEffect, useMemo } from 'react';

interface Registration {
  bookingId: string;
  name: string;
  email: string;
  phone: string;
  organization: string;
  designation: string;
  registrationType: string;
  amount: number;
  utrNumber: string;
  registeredAt: string;
  checkedIn: boolean;
  checkinTime: string;
}

export default function AdminPage() {
  const [regs, setRegs] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'checked' | 'pending'>('all');

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/registrations');
      if (res.ok) {
        const data = await res.json();
        setRegs(data.registrations);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let list = regs;
    if (filter === 'checked') list = list.filter((r) => r.checkedIn);
    if (filter === 'pending') list = list.filter((r) => !r.checkedIn);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.phone.includes(q) ||
          r.bookingId.toLowerCase().includes(q),
      );
    }
    return list;
  }, [regs, search, filter]);

  const checkedInCount = regs.filter((r) => r.checkedIn).length;
  const totalRevenue = regs.reduce((s, r) => s + r.amount, 0);
  const checkinRate = regs.length > 0 ? Math.round((checkedInCount / regs.length) * 100) : 0;

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          'radial-gradient(ellipse at 25% 15%, #0d1f0e 0%, #050d07 55%, #020507 100%)',
      }}
    >
      <div className="max-w-7xl mx-auto px-5 py-8">

        {/* Page header */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-black tracking-[0.3em] uppercase text-[#c8a96e] mb-1">
              Event Management
            </p>
            <h1 className="text-3xl font-black text-white tracking-tight">Registrations</h1>
            <p className="text-sm text-white/30 mt-1">Real-time overview of all attendees</p>
          </div>
          {!loading && regs.length > 0 && (
            <div
              className="text-right hidden sm:block px-4 py-2 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Check-in Rate</p>
              <p className="text-2xl font-black text-white mt-0.5">{checkinRate}<span className="text-base text-white/40">%</span></p>
            </div>
          )}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Total Registered"
            value={loading ? '—' : regs.length}
            icon={<UsersIcon />}
            gradFrom="#1e3a5f"
            gradTo="#0f2040"
            borderColor="rgba(59,130,246,0.2)"
            glowColor="rgba(59,130,246,0.15)"
            valueColor="#93c5fd"
          />
          <StatCard
            label="Checked In"
            value={loading ? '—' : checkedInCount}
            icon={<CheckCircleIcon />}
            gradFrom="#14412a"
            gradTo="#0a2518"
            borderColor="rgba(74,222,128,0.2)"
            glowColor="rgba(74,222,128,0.12)"
            valueColor="#4ade80"
            sub={loading ? undefined : `${checkinRate}% entry rate`}
            subColor="#4ade80"
          />
          <StatCard
            label="Pending Entry"
            value={loading ? '—' : regs.length - checkedInCount}
            icon={<ClockIcon />}
            gradFrom="#3d2a0a"
            gradTo="#231805"
            borderColor="rgba(251,191,36,0.2)"
            glowColor="rgba(251,191,36,0.1)"
            valueColor="#fbbf24"
          />
          <StatCard
            label="Total Revenue"
            value={loading ? '—' : `₹${totalRevenue.toLocaleString('en-IN')}`}
            icon={<RupeeIcon />}
            gradFrom="#3d2e0a"
            gradTo="#241b05"
            borderColor="rgba(200,169,110,0.25)"
            glowColor="rgba(200,169,110,0.12)"
            valueColor="#c8a96e"
            smallValue
          />
        </div>

        {/* Check-in progress bar */}
        {!loading && regs.length > 0 && (
          <div
            className="mb-6 rounded-2xl px-5 py-4"
            style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                Check-in Progress
              </span>
              <span className="text-xs font-bold text-white/50">
                {checkedInCount} / {regs.length} attendees
              </span>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${checkinRate}%`,
                  background: 'linear-gradient(90deg, #1a4a1a, #2e7d32, #4ade80)',
                  boxShadow: '0 0 16px rgba(74,222,128,0.5)',
                }}
              />
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          {/* Search */}
          <div className="relative flex-1 min-w-52">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
              <svg className="w-4 h-4 text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <input
              type="search"
              placeholder="Search name, email, phone or booking ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              onFocus={(e) => {
                e.target.style.border = '1px solid rgba(200,169,110,0.35)';
                e.target.style.boxShadow = '0 0 0 3px rgba(200,169,110,0.07)';
              }}
              onBlur={(e) => {
                e.target.style.border = '1px solid rgba(255,255,255,0.08)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Filter tabs */}
          <div
            className="flex rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {(['all', 'checked', 'pending'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-4 py-2.5 text-xs font-bold capitalize transition-all"
                style={
                  filter === f
                    ? {
                        background: 'linear-gradient(135deg, #1a4a1a, #2e7d32)',
                        color: '#fff',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
                      }
                    : { background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.35)' }
                }
              >
                {f === 'all' ? 'All' : f === 'checked' ? 'Checked In' : 'Pending'}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={load}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all text-white/40 hover:text-white"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Refresh
          </button>

          {/* Export */}
          <a
            href="/api/admin/download"
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-all text-white"
            style={{
              background: 'linear-gradient(135deg, #9a7640, #c8a96e)',
              boxShadow: '0 2px 16px rgba(200,169,110,0.3)',
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export Excel
          </a>
        </div>

        {/* Empty banner */}
        {regs.length === 0 && !loading && (
          <div
            className="rounded-2xl px-5 py-4 mb-5"
            style={{ background: 'rgba(200,169,110,0.07)', border: '1px solid rgba(200,169,110,0.15)' }}
          >
            <p className="text-sm text-[#c8a96e]">
              No registrations yet — they will appear here once someone registers.
            </p>
          </div>
        )}

        {/* Table */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {loading ? (
            <div className="py-24 flex flex-col items-center gap-4">
              <div
                className="w-9 h-9 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: 'rgba(46,125,50,0.4)', borderTopColor: '#2e7d32' }}
              />
              <p className="text-sm text-white/25">Loading registrations…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 flex flex-col items-center gap-3">
              <svg className="w-10 h-10 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <p className="text-sm text-white/25">No registrations match your search.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-white/25">Booking ID</th>
                    <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-white/25">Attendee</th>
                    <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-white/25 hidden sm:table-cell">Type</th>
                    <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-white/25 hidden md:table-cell">Amount</th>
                    <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-white/25 hidden lg:table-cell">Phone</th>
                    <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-white/25 hidden lg:table-cell">Registered</th>
                    <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-white/25">Status</th>
                    <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-white/25 hidden md:table-cell">Ticket</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => (
                    <TableRow key={r.bookingId} r={r} i={i} />
                  ))}
                </tbody>
              </table>

              {/* Footer */}
              <div
                className="px-5 py-3.5 flex items-center justify-between"
                style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
              >
                <p className="text-xs text-white/25">
                  Showing{' '}
                  <span className="text-white/50 font-bold">{filtered.length}</span>{' '}
                  of{' '}
                  <span className="text-white/50 font-bold">{regs.length}</span>{' '}
                  registrations
                </p>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"
                    style={{ boxShadow: '0 0 6px #4ade80' }}
                  />
                  <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Live</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Table row ────────────────────────────────────────────────────────────────
function TableRow({ r, i }: { r: Registration; i: number }) {
  const [hovered, setHovered] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [viewing, setViewing] = useState(false);
  const base = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)';

  const displayRegType =
    r.registrationType === 'Non-Architect' || r.registrationType === 'Non - Architect'
      ? 'Delegate'
      : r.registrationType;

  async function fetchTicketBlob(): Promise<Blob> {
    const res = await fetch('/api/ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: r.bookingId,
        name: r.name,
        email: r.email,
        phone: r.phone,
        organization: r.organization,
        designation: r.designation,
        registrationType: r.registrationType,
        totalAmount: r.amount,
        utrNumber: r.utrNumber,
      }),
    });
    if (!res.ok) throw new Error('Failed');
    return res.blob();
  }

  async function viewTicket() {
    setViewing(true);
    try {
      const blob = await fetchTicketBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      alert('Could not load ticket preview.');
    } finally {
      setViewing(false);
    }
  }

  async function downloadTicket() {
    setDownloading(true);
    try {
      const blob = await fetchTicketBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prakriti2026-ticket-${r.bookingId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert('Could not download ticket.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <tr
      style={{
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        background: hovered ? 'rgba(46,125,50,0.07)' : base,
        transition: 'background 0.15s',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <td className="px-5 py-4 font-mono text-xs font-bold" style={{ color: '#c8a96e' }}>
        {r.bookingId}
      </td>
      <td className="px-5 py-4">
        <p className="font-semibold text-white text-sm leading-snug">{r.name}</p>
        <p className="text-xs text-white/30 mt-0.5">{r.email}</p>
      </td>
      <td className="px-5 py-4 hidden sm:table-cell">
        <span
          className="inline-block text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full"
          style={{
            background: 'rgba(46,125,50,0.18)',
            color: '#4ade80',
            border: '1px solid rgba(74,222,128,0.2)',
          }}
        >
          {displayRegType}
        </span>
      </td>
      <td className="px-5 py-4 hidden md:table-cell">
        <span className="text-sm font-bold text-white/75">₹{r.amount.toLocaleString('en-IN')}</span>
      </td>
      <td className="px-5 py-4 hidden lg:table-cell text-xs text-white/35">{r.phone}</td>
      <td className="px-5 py-4 hidden lg:table-cell text-xs text-white/25">{r.registeredAt}</td>
      <td className="px-5 py-4">
        {r.checkedIn ? (
          <div>
            <span
              className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full"
              style={{
                background: 'rgba(74,222,128,0.12)',
                color: '#4ade80',
                border: '1px solid rgba(74,222,128,0.22)',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0"
                style={{ boxShadow: '0 0 6px #4ade80' }}
              />
              Checked In
            </span>
            {r.checkinTime && (
              <p className="text-[10px] text-white/20 mt-1">{r.checkinTime}</p>
            )}
          </div>
        ) : (
          <span
            className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full"
            style={{
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.28)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white/20 flex-shrink-0" />
            Pending
          </span>
        )}
      </td>
      <td className="px-5 py-4 hidden md:table-cell">
        <div className="flex items-center gap-1.5">
          {/* View button */}
          <button
            onClick={viewTicket}
            disabled={viewing || downloading}
            title="View ticket in new tab"
            className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-40"
            style={{
              background: viewing ? 'rgba(99,179,237,0.08)' : 'rgba(99,179,237,0.12)',
              color: '#63b3ed',
              border: '1px solid rgba(99,179,237,0.2)',
            }}
          >
            {viewing ? (
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
            {viewing ? '…' : 'View'}
          </button>

          {/* Download button */}
          <button
            onClick={downloadTicket}
            disabled={downloading || viewing}
            title="Download ticket PDF"
            className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-40"
            style={{
              background: downloading ? 'rgba(200,169,110,0.08)' : 'rgba(200,169,110,0.12)',
              color: '#c8a96e',
              border: '1px solid rgba(200,169,110,0.2)',
            }}
          >
            {downloading ? (
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v13m0 0l-4-4m4 4l4-4M3 21h18" />
              </svg>
            )}
            {downloading ? '…' : 'PDF'}
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon,
  gradFrom,
  gradTo,
  borderColor,
  glowColor,
  valueColor,
  sub,
  subColor,
  smallValue,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  gradFrom: string;
  gradTo: string;
  borderColor: string;
  glowColor: string;
  valueColor: string;
  sub?: string;
  subColor?: string;
  smallValue?: boolean;
}) {
  return (
    <div
      className="relative rounded-2xl p-5 overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${gradFrom} 0%, ${gradTo} 100%)`,
        border: `1px solid ${borderColor}`,
        boxShadow: `0 4px 24px ${glowColor}`,
      }}
    >
      {/* Corner glow */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${glowColor.replace('0.', '0.3').replace('0.3', '0.4')}, transparent 70%)`,
          transform: 'translate(30%, -30%)',
        }}
      />
      {/* Icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
        style={{ background: 'rgba(255,255,255,0.07)', color: valueColor }}
      >
        {icon}
      </div>
      {/* Value */}
      <p
        className={`font-black text-white ${smallValue ? 'text-xl' : 'text-2xl'}`}
        style={{ color: valueColor, textShadow: `0 0 20px ${glowColor}` }}
      >
        {value}
      </p>
      {/* Label */}
      <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 mt-1">{label}</p>
      {/* Sub */}
      {sub && (
        <p className="text-[10px] mt-1 font-semibold" style={{ color: subColor ?? valueColor, opacity: 0.6 }}>
          {sub}
        </p>
      )}
    </div>
  );
}

// ── Icons ────────────────────────────────────────────────────────────────────
function UsersIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function RupeeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 8.25H9m6 3H9m3 6l-3-3h1.5a3 3 0 100-6M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
