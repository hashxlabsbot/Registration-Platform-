'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

interface Member { name: string; checkedIn?: boolean; checkinTime?: string }
interface Registration {
  bookingId: string;
  name: string;
  registrationType: string;
  checkedIn: boolean;
  checkinTime: string;
  members?: Member[];
}

interface Entry { name: string; type: string; time: string; ts: number }

const REFRESH_MS = 5000;

function parseIST(s: string): number {
  // checkinTime is an en-IN locale string; Date can't parse reliably, so we
  // only use it for display. Ordering falls back to array position.
  const t = Date.parse(s);
  return Number.isNaN(t) ? 0 : t;
}

export default function LivePage() {
  const [regs, setRegs] = useState<Registration[]>([]);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/registrations', { cache: 'no-store' });
      if (!res.ok) { setError(true); return; }
      const d = await res.json();
      setRegs(d.registrations ?? []);
      setUpdatedAt(new Date());
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, REFRESH_MS);
    return () => clearInterval(iv);
  }, [load]);

  const stats = useMemo(() => {
    let totalAttendees = 0;
    let checkedIn = 0;
    const entries: Entry[] = [];

    for (const r of regs) {
      const members = r.members ?? [];
      totalAttendees += 1 + members.length;
      if (r.checkedIn) {
        checkedIn += 1;
        entries.push({ name: r.name, type: r.registrationType, time: r.checkinTime, ts: parseIST(r.checkinTime) });
      }
      members.forEach((m) => {
        if (m.checkedIn) {
          checkedIn += 1;
          entries.push({ name: m.name || 'Guest', type: 'Guest', time: m.checkinTime ?? '', ts: parseIST(m.checkinTime ?? '') });
        }
      });
    }

    entries.sort((a, b) => b.ts - a.ts);
    const rate = totalAttendees > 0 ? Math.round((checkedIn / totalAttendees) * 100) : 0;
    return { totalAttendees, checkedIn, pending: totalAttendees - checkedIn, rate, recent: entries.slice(0, 12) };
  }, [regs]);

  return (
    <div className="min-h-[calc(100vh-56px)] px-6 py-8"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, #0d2914 0%, #050d07 55%, #020507 100%)' }}>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <p className="text-[11px] font-black tracking-[0.35em] uppercase text-[#c8a96e] mb-1">Prakriti 2026 · Live</p>
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">Door Status</h1>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: error ? 'rgba(239,68,68,0.1)' : 'rgba(74,222,128,0.08)', border: `1px solid ${error ? 'rgba(239,68,68,0.25)' : 'rgba(74,222,128,0.2)'}` }}>
            <span className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: error ? '#f87171' : '#4ade80', boxShadow: `0 0 8px ${error ? '#f87171' : '#4ade80'}` }} />
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: error ? '#f87171' : 'rgba(74,222,128,0.8)' }}>
              {error ? 'Reconnecting' : `Live · ${updatedAt ? updatedAt.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }) : '—'}`}
            </span>
          </div>
        </div>

        {/* Hero number */}
        <div className="rounded-3xl px-8 py-10 mb-6 text-center"
          style={{ background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.15)', boxShadow: '0 0 60px rgba(46,125,50,0.15)' }}>
          <p className="text-[12px] font-black uppercase tracking-[0.3em] text-green-400/60 mb-3">Inside the Venue</p>
          <p className="font-black text-green-300 leading-none" style={{ fontSize: 'clamp(5rem, 18vw, 11rem)', textShadow: '0 0 50px rgba(74,222,128,0.4)' }}>
            {stats.checkedIn}
          </p>
          <p className="text-white/40 text-lg mt-3 font-semibold">of {stats.totalAttendees} expected attendees</p>
        </div>

        {/* Secondary stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Checked In', value: stats.checkedIn, color: '#4ade80' },
            { label: 'Pending', value: stats.pending, color: '#fbbf24' },
            { label: 'Turnout', value: `${stats.rate}%`, color: '#c8a96e' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl px-5 py-6 text-center"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="font-black leading-none" style={{ color: s.color, fontSize: 'clamp(2rem, 6vw, 3.5rem)' }}>{s.value}</p>
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/35 mt-2">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="h-4 rounded-full overflow-hidden mb-8" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${stats.rate}%`, background: 'linear-gradient(90deg, #1a4a1a, #2e7d32, #4ade80)', boxShadow: '0 0 16px rgba(74,222,128,0.5)' }} />
        </div>

        {/* Latest entries ticker */}
        <p className="text-[11px] font-black uppercase tracking-[0.25em] text-white/40 mb-4">Latest Entries</p>
        {stats.recent.length === 0 ? (
          <p className="text-white/25 text-center py-10">No check-ins yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {stats.recent.map((e, i) => (
              <div key={`${e.name}-${i}`} className="flex items-center justify-between gap-3 rounded-2xl px-5 py-4"
                style={{ background: 'rgba(74,222,128,0.04)', border: '1px solid rgba(74,222,128,0.1)' }}>
                <div className="min-w-0">
                  <p className="font-bold text-white text-lg truncate">{e.name}</p>
                  <p className="text-xs text-white/35 mt-0.5">{e.type}</p>
                </div>
                <span className="text-[11px] text-white/30 font-mono flex-shrink-0">{e.time.split(',').pop()?.trim() || ''}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
