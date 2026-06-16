'use client';

import { useState, useEffect, useMemo } from 'react';

interface Member {
  name: string;
  relation: string;
  email: string;
  phone: string;
  checkedIn?: boolean;
  checkinTime?: string;
}

interface Registration {
  bookingId: string;
  name: string;
  email: string;
  phone: string;
  organization: string;
  registrationType: string;
  checkedIn: boolean;
  checkinTime: string;
  members?: Member[];
}

interface TimelineSlot {
  label: string;
  count: number;
}

interface RecentCheckin {
  bookingId: string;
  name: string;
  registrationType: string;
  checkinTime: string;
}

export default function CheckinPage() {
  const [regs, setRegs] = useState<Registration[]>([]);
  const [timeline, setTimeline] = useState<TimelineSlot[]>([]);
  const [recent, setRecent] = useState<RecentCheckin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [checking, setChecking] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ id: string; status: 'ok' | 'already' } | null>(null);
  const [role, setRole] = useState<string>('admin');

  async function loadAll() {
    setLoading(true);
    try {
      const [regsRes, statsRes] = await Promise.all([
        fetch('/api/admin/registrations'),
        fetch('/api/admin/checkin-stats'),
      ]);
      if (regsRes.ok) {
        const d = await regsRes.json();
        setRegs(d.registrations);
        if (d.role) setRole(d.role);
      }
      if (statsRes.ok) {
        const d = await statsRes.json();
        setTimeline(d.timeline);
        setRecent(d.recent);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase().trim();
    return regs.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.phone.includes(q) ||
        r.bookingId.toLowerCase().includes(q),
    ).slice(0, 10);
  }, [regs, search]);

  // key uniquely identifies a row: "BOOKING" for primary, "BOOKING:2" for member #2
  function rowKey(bookingId: string, memberIndex = 0) {
    return memberIndex >= 1 ? `${bookingId}:${memberIndex}` : bookingId;
  }

  async function handleCheckin(bookingId: string, memberIndex = 0) {
    const key = rowKey(bookingId, memberIndex);
    setChecking(key);
    try {
      const res = await fetch('/api/admin/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, memberIndex }),
      });
      const data = await res.json();
      setLastResult({ id: key, status: data.status });

      // Optimistically reflect the new state in the local list
      setRegs((prev) => prev.map((r) => {
        if (r.bookingId !== bookingId) return r;
        if (memberIndex >= 1) {
          const members = (r.members ?? []).map((m, i) =>
            i === memberIndex - 1 ? { ...m, checkedIn: true } : m);
          return { ...r, members };
        }
        return { ...r, checkedIn: true };
      }));

      if (data.status === 'ok') {
        const reg = regs.find((r) => r.bookingId === bookingId);
        const who = memberIndex >= 1 ? reg?.members?.[memberIndex - 1]?.name : reg?.name;
        if (reg && who) {
          setRecent((prev) => [
            { bookingId, name: who, registrationType: memberIndex >= 1 ? 'Guest' : reg.registrationType, checkinTime: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) },
            ...prev,
          ].slice(0, 20));
        }
      }
    } finally {
      setChecking(null);
    }
  }

  async function handleUndo(bookingId: string, memberIndex = 0) {
    const key = rowKey(bookingId, memberIndex);
    if (!confirm('Reverse this check-in? The attendee will be marked as not checked in.')) return;
    setChecking(key);
    try {
      const res = await fetch('/api/admin/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, memberIndex, undo: true }),
      });
      const data = await res.json();
      if (data.status === 'ok') {
        setLastResult(null);
        setRegs((prev) => prev.map((r) => {
          if (r.bookingId !== bookingId) return r;
          if (memberIndex >= 1) {
            const members = (r.members ?? []).map((m, i) =>
              i === memberIndex - 1 ? { ...m, checkedIn: false } : m);
            return { ...r, members };
          }
          return { ...r, checkedIn: false };
        }));
      } else if (data.error) {
        alert(data.error);
      }
    } finally {
      setChecking(null);
    }
  }

  const totalCheckedIn = regs.filter((r) => r.checkedIn).length;
  const maxCount = timeline.length > 0 ? Math.max(...timeline.map((t) => t.count)) : 1;

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at 25% 15%, #0d1f0e 0%, #050d07 55%, #020507 100%)' }}>
      <div className="max-w-7xl mx-auto px-5 py-8">

        {/* Header */}
        <div className="mb-8">
          <p className="text-[10px] font-black tracking-[0.3em] uppercase text-[#c8a96e] mb-1">Event Management</p>
          <h1 className="text-3xl font-black text-white tracking-tight">Check-in</h1>
          <p className="text-sm text-white/30 mt-1">Manual attendance management &amp; check-in timeline</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* Left: search + results */}
          <div className="lg:col-span-2 space-y-5">

            {/* Stat bar */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Checked In', value: loading ? '—' : totalCheckedIn, color: '#4ade80' },
                { label: 'Pending', value: loading ? '—' : regs.length - totalCheckedIn, color: '#fbbf24' },
                { label: 'Rate', value: loading || regs.length === 0 ? '—' : `${Math.round((totalCheckedIn / regs.length) * 100)}%`, color: '#c8a96e' },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl px-4 py-3"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Search */}
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-3">Search &amp; Check In</p>
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <svg className="w-4 h-4 text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </div>
                <input
                  type="search"
                  placeholder="Search by name, email, phone or booking ID…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setLastResult(null); }}
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  onFocus={(e) => { e.target.style.border = '1px solid rgba(200,169,110,0.35)'; }}
                  onBlur={(e) => { e.target.style.border = '1px solid rgba(255,255,255,0.08)'; }}
                />
              </div>

              {search.trim() && searchResults.length === 0 && (
                <p className="text-sm text-white/30 text-center py-4">No matching registrations found.</p>
              )}

              {searchResults.length > 0 && (
                <div className="space-y-3">
                  {searchResults.map((r) => {
                    const members = r.members ?? [];
                    const groupTotal = 1 + members.length;
                    const groupIn = (r.checkedIn ? 1 : 0) + members.filter((m) => m.checkedIn).length;

                    return (
                      <div
                        key={r.bookingId}
                        className="rounded-xl overflow-hidden"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        {/* Primary registrant */}
                        <CheckinRow
                          name={r.name}
                          sub={`${r.email} · ${r.phone}`}
                          badge={r.registrationType}
                          mono={r.bookingId}
                          checkedIn={r.checkedIn}
                          checking={checking === rowKey(r.bookingId)}
                          anyChecking={!!checking}
                          justResult={lastResult?.id === rowKey(r.bookingId) ? lastResult.status : null}
                          showUndo={role === 'admin'}
                          onCheckin={() => handleCheckin(r.bookingId)}
                          onUndo={() => handleUndo(r.bookingId)}
                        />

                        {/* Group progress + guests */}
                        {members.length > 0 && (
                          <>
                            <div className="px-4 py-1.5 flex items-center justify-between"
                              style={{ background: 'rgba(0,0,0,0.25)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/35">
                                {members.length} Guest{members.length > 1 ? 's' : ''}
                              </span>
                              <span className="text-[10px] font-bold" style={{ color: groupIn === groupTotal ? '#4ade80' : '#fbbf24' }}>
                                {groupIn}/{groupTotal} in
                              </span>
                            </div>
                            {members.map((m, mi) => (
                              <CheckinRow
                                key={`${r.bookingId}-M${mi + 1}`}
                                name={m.name || `Guest ${mi + 1}`}
                                sub={[m.relation, m.phone].filter(Boolean).join(' · ') || 'Guest'}
                                mono={`${r.bookingId}-M${mi + 1}`}
                                indent
                                checkedIn={!!m.checkedIn}
                                checking={checking === rowKey(r.bookingId, mi + 1)}
                                anyChecking={!!checking}
                                justResult={lastResult?.id === rowKey(r.bookingId, mi + 1) ? lastResult.status : null}
                                showUndo={role === 'admin'}
                                onCheckin={() => handleCheckin(r.bookingId, mi + 1)}
                                onUndo={() => handleUndo(r.bookingId, mi + 1)}
                              />
                            ))}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Hourly timeline chart */}
            {timeline.length > 0 && (
              <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4">Check-in Timeline (by hour)</p>
                <div className="space-y-2">
                  {timeline.map((slot) => (
                    <div key={slot.label} className="flex items-center gap-3">
                      <span className="text-xs font-mono text-white/40 w-20 flex-shrink-0">{slot.label}</span>
                      <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.round((slot.count / maxCount) * 100)}%`,
                            background: 'linear-gradient(90deg, #1a4a1a, #2e7d32, #4ade80)',
                            boxShadow: '0 0 8px rgba(74,222,128,0.4)',
                          }}
                        />
                      </div>
                      <span className="text-xs font-bold text-white/50 w-6 text-right flex-shrink-0">{slot.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: recent check-ins feed — below on mobile, sidebar on desktop */}
          <div>
            <div className="rounded-2xl p-5 lg:sticky lg:top-20" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Recent Check-ins</p>
                <button onClick={loadAll} className="text-[10px] font-bold text-white/30 hover:text-white/60 transition-all">Refresh</button>
              </div>

              {loading && (
                <div className="py-8 flex justify-center">
                  <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: 'rgba(46,125,50,0.4)', borderTopColor: '#2e7d32' }} />
                </div>
              )}

              {!loading && recent.length === 0 && (
                <p className="text-sm text-white/25 text-center py-6">No check-ins yet.</p>
              )}

              <div className="space-y-2">
                {recent.map((r, i) => (
                  <div key={`${r.bookingId}-${i}`} className="rounded-xl px-3 py-2.5"
                    style={{ background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.1)' }}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-white leading-snug">{r.name}</p>
                        <p className="text-[10px] text-white/35 mt-0.5">{r.registrationType}</p>
                      </div>
                      <span className="w-2 h-2 mt-1 rounded-full bg-green-400 flex-shrink-0" style={{ boxShadow: '0 0 6px #4ade80' }} />
                    </div>
                    <p className="text-[10px] text-white/25 mt-1">{r.checkinTime}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CheckinRowProps {
  name: string;
  sub: string;
  badge?: string;
  mono: string;
  indent?: boolean;
  checkedIn: boolean;
  checking: boolean;
  anyChecking: boolean;
  justResult: 'ok' | 'already' | null;
  showUndo: boolean;
  onCheckin: () => void;
  onUndo: () => void;
}

function CheckinRow({
  name, sub, badge, mono, indent, checkedIn, checking, anyChecking, justResult, showUndo, onCheckin, onUndo,
}: CheckinRowProps) {
  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-3 transition-all"
      style={{
        paddingLeft: indent ? '2.5rem' : undefined,
        background: checkedIn ? 'rgba(74,222,128,0.05)' : 'transparent',
        borderTop: indent ? '1px solid rgba(255,255,255,0.04)' : undefined,
      }}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-white text-sm">{name}</p>
          {badge && (
            <span className="text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(46,125,50,0.18)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }}>
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-white/35 mt-0.5">{sub}</p>
        <p className="font-mono text-[10px] text-[#c8a96e] mt-0.5">{mono}</p>
      </div>

      <div className="flex-shrink-0 flex items-center gap-2">
        {checkedIn ? (
          <>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              {justResult === 'already' ? 'Already in' : 'Checked In'}
            </span>
            {showUndo && (
              <button
                onClick={onUndo}
                disabled={anyChecking}
                title="Undo check-in"
                className="inline-flex items-center justify-center w-7 h-7 rounded-lg transition-all disabled:opacity-40 text-white/40 hover:text-red-300"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                </svg>
              </button>
            )}
          </>
        ) : (
          <button
            onClick={onCheckin}
            disabled={anyChecking}
            className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #1a4a1a, #2e7d32)', color: '#fff', boxShadow: '0 2px 12px rgba(46,125,50,0.3)' }}
          >
            {checking ? (
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            )}
            Check In
          </button>
        )}
      </div>
    </div>
  );
}
