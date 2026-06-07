'use client';

import { useState, useEffect } from 'react';

interface StaffAccount {
  id: number;
  username: string;
  role: string;
  created_at: string;
}

export default function TeamPage() {
  const [staff, setStaff] = useState<StaffAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('volunteer');
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadStaff() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/staff');
      if (res.ok) {
        const d = await res.json();
        setStaff(d.staff);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadStaff(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setCreating(true);
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to create account.');
      } else {
        setSuccess(`Account "${username}" created.`);
        setUsername('');
        setPassword('');
        setStaff((prev) => [data.staff, ...prev]);
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Remove "${name}"? They will no longer be able to log in.`)) return;
    setDeleting(id);
    try {
      await fetch('/api/admin/staff', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setStaff((prev) => prev.filter((s) => s.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
  };

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at 25% 15%, #0d1f0e 0%, #050d07 55%, #020507 100%)' }}>
      <div className="max-w-5xl mx-auto px-5 py-8">

        {/* Header */}
        <div className="mb-8">
          <p className="text-[10px] font-black tracking-[0.3em] uppercase text-[#c8a96e] mb-1">Event Management</p>
          <h1 className="text-3xl font-black text-white tracking-tight">Team</h1>
          <p className="text-sm text-white/30 mt-1">Manage staff and volunteer accounts for event-day access</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* Add account form */}
          <div>
            <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4">Add Account</p>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-white/35 mb-1.5">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. volunteer1"
                    required
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all"
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.border = '1px solid rgba(200,169,110,0.35)'; }}
                    onBlur={(e) => { e.target.style.border = '1px solid rgba(255,255,255,0.08)'; }}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-white/35 mb-1.5">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Strong password"
                    required
                    minLength={6}
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all"
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.border = '1px solid rgba(200,169,110,0.35)'; }}
                    onBlur={(e) => { e.target.style.border = '1px solid rgba(255,255,255,0.08)'; }}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-white/35 mb-1.5">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <option value="volunteer" style={{ background: '#0d1f0e' }}>Volunteer — QR Scan only</option>
                  </select>
                  <p className="text-[10px] text-white/25 mt-1.5">Volunteers can only access the QR scanner.</p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs text-red-300"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
                    {error}
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs text-green-400"
                    style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.18)' }}>
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={creating}
                  className="w-full py-3 rounded-xl font-black text-sm tracking-wider transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #1a4a1a 0%, #2e7d32 100%)', color: '#fff' }}
                >
                  {creating ? (
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  )}
                  {creating ? 'Creating…' : 'Create Account'}
                </button>
              </form>
            </div>

            {/* Info box */}
            <div className="mt-4 rounded-2xl px-4 py-4"
              style={{ background: 'rgba(99,179,237,0.05)', border: '1px solid rgba(99,179,237,0.12)' }}>
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#63b3ed] mb-2">Role Access</p>
              <div className="space-y-1.5 text-xs text-white/45">
                <p><span className="text-white/60 font-semibold">Admin</span> — Full access (set via ADMIN_SECRET)</p>
                <p><span className="text-[#63b3ed] font-semibold">Volunteer</span> — QR scanner only, no data access</p>
              </div>
            </div>
          </div>

          {/* Staff list */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                  Staff Accounts <span className="text-white/25 font-bold ml-1">({staff.length})</span>
                </p>
              </div>

              {loading ? (
                <div className="py-16 flex justify-center">
                  <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: 'rgba(46,125,50,0.4)', borderTopColor: '#2e7d32' }} />
                </div>
              ) : staff.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-sm text-white/25">No staff accounts yet.</p>
                  <p className="text-xs text-white/15 mt-1">Add volunteers using the form on the left.</p>
                </div>
              ) : (
                <div>
                  {staff.map((s, i) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between px-5 py-4"
                      style={{ borderBottom: i < staff.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(99,179,237,0.1)', border: '1px solid rgba(99,179,237,0.15)' }}>
                          <svg className="w-4.5 h-4.5 text-[#63b3ed]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ width: '1.1rem', height: '1.1rem' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">{s.username}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                              style={{ background: 'rgba(99,179,237,0.1)', color: '#63b3ed', border: '1px solid rgba(99,179,237,0.2)' }}>
                              {s.role}
                            </span>
                            <span className="text-[10px] text-white/25">
                              Added {new Date(s.created_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDelete(s.id, s.username)}
                        disabled={deleting === s.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40 text-white/30 hover:text-red-400 hover:bg-red-500/10"
                      >
                        {deleting === s.id ? (
                          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        )}
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
