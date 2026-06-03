'use client';

import { useState, useEffect } from 'react';

interface InviteCode {
  code: string;
  description: string;
  used: boolean;
  usedBy: string;
  createdAt: string;
}

export default function InviteCodesPage() {
  const [codes, setCodes]   = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [desc, setDesc]     = useState('');
  const [creating, setCreating] = useState(false);
  const [newCode, setNewCode]   = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/invite-codes');
      if (res.ok) {
        const data = await res.json();
        setCodes(data.codes);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setNewCode('');
    try {
      const res = await fetch('/api/admin/invite-codes', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ description: desc }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewCode(data.code);
        setDesc('');
        await load();
      }
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => { load(); }, []);

  const unused = codes.filter((c) => !c.used).length;

  return (
    <div
      className="min-h-screen"
      style={{ background: 'radial-gradient(ellipse at 25% 15%, #0d1f0e 0%, #050d07 55%, #020507 100%)' }}
    >
      <div className="max-w-4xl mx-auto px-5 py-8">

        {/* Header */}
        <div className="mb-8">
          <p className="text-[10px] font-black tracking-[0.3em] uppercase text-[#c8a96e] mb-1">Admin</p>
          <h1 className="text-3xl font-black text-white tracking-tight">Invite Codes</h1>
          <p className="text-sm text-white/30 mt-1">Generate single-use codes for Special Invitee registrations</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Codes', value: codes.length, color: '#93c5fd' },
            { label: 'Available',   value: unused,        color: '#4ade80' },
            { label: 'Used',        value: codes.length - unused, color: '#fbbf24' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-4"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30">{s.label}</p>
              <p className="text-2xl font-black mt-1" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Generate form */}
        <form onSubmit={handleCreate}
          className="rounded-2xl p-5 mb-6"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-3">Generate New Code</p>
          <div className="flex gap-3">
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Description (e.g. Guest Speaker, VIP Sponsor)"
              className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/20 outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
            />
            <button type="submit" disabled={creating}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #1a4a1a, #2e7d32)', boxShadow: '0 2px 12px rgba(46,125,50,0.35)' }}>
              {creating ? 'Generating…' : '+ Generate'}
            </button>
          </div>

          {newCode && (
            <div className="mt-3 flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
              <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-green-300">New code generated:</p>
              <span className="font-mono font-black text-[#c8a96e] text-base tracking-wider">{newCode}</span>
            </div>
          )}
        </form>

        {/* Codes table */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {loading ? (
            <div className="py-16 flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: 'rgba(46,125,50,0.4)', borderTopColor: '#2e7d32' }} />
              <p className="text-sm text-white/25">Loading…</p>
            </div>
          ) : codes.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-white/25">No invite codes yet. Generate one above.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-white/25">Code</th>
                  <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-white/25">Description</th>
                  <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-white/25 hidden md:table-cell">Used By</th>
                  <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-white/25 hidden sm:table-cell">Created</th>
                  <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-white/25">Status</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((c, i) => (
                  <tr key={c.code}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)',
                    }}>
                    <td className="px-5 py-4 font-mono font-black text-sm" style={{ color: '#c8a96e' }}>{c.code}</td>
                    <td className="px-5 py-4 text-sm text-white/60">{c.description || '—'}</td>
                    <td className="px-5 py-4 hidden md:table-cell text-xs text-white/35 font-mono">{c.usedBy || '—'}</td>
                    <td className="px-5 py-4 hidden sm:table-cell text-xs text-white/25">{c.createdAt}</td>
                    <td className="px-5 py-4">
                      {c.used ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full"
                          style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                          Used
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full"
                          style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0"
                            style={{ boxShadow: '0 0 6px #4ade80' }} />
                          Available
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
