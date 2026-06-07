'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Tab = 'admin' | 'staff';

export default function AdminLoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('admin');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAdminSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: password }),
    });
    if (res.ok) {
      router.replace('/admin');
    } else {
      const data = await res.json();
      setError(data.error ?? 'Login failed.');
    }
    setLoading(false);
  }

  async function handleStaffSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/admin/staff-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: staffPassword }),
    });
    if (res.ok) {
      router.replace('/admin/scan');
    } else {
      const data = await res.json();
      setError(data.error ?? 'Login failed.');
    }
    setLoading(false);
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.09)',
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 60% 40%, #0d2914 0%, #050d07 55%, #000 100%)' }}
    >
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(200,169,110,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(200,169,110,0.4) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] rounded-full blur-[160px] opacity-25 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #2e7d32, transparent 70%)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-[120px] opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #c8a96e, transparent 70%)' }} />

      <div className="relative z-10 w-full max-w-md px-4">
        <div
          className="rounded-3xl overflow-hidden shadow-2xl"
          style={{
            background: 'rgba(8, 20, 10, 0.85)',
            backdropFilter: 'blur(28px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 25px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(200,169,110,0.06)',
          }}
        >
          {/* Header */}
          <div className="px-10 pt-10 pb-7 text-center">
            <div className="mx-auto mb-5 relative w-fit">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #1a4a1a 0%, #2e7d32 100%)', boxShadow: '0 0 32px rgba(46,125,50,0.5), 0 0 0 1px rgba(74,222,128,0.15)' }}>
                <svg className="w-8 h-8 text-[#c8a96e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div className="absolute -inset-1 rounded-2xl opacity-20 blur-sm pointer-events-none"
                style={{ background: 'linear-gradient(135deg, #2e7d32, #c8a96e)' }} />
            </div>
            <p className="text-[10px] font-black tracking-[0.35em] uppercase text-[#c8a96e]">Admin Portal</p>
            <h1 className="mt-2 text-2xl font-black text-white tracking-tight">Prakriti 2026</h1>
            <p className="mt-1 text-xs text-white/35">Event Management Dashboard</p>
          </div>

          {/* Tabs */}
          <div className="px-10 mb-2">
            <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              {(['admin', 'staff'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError(''); }}
                  className="flex-1 py-2.5 text-xs font-bold capitalize transition-all"
                  style={
                    tab === t
                      ? { background: 'linear-gradient(135deg, #1a4a1a, #2e7d32)', color: '#fff' }
                      : { background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.35)' }
                  }
                >
                  {t === 'admin' ? 'Admin' : 'Staff / Volunteer'}
                </button>
              ))}
            </div>
          </div>

          <div className="mx-10 my-4 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(200,169,110,0.25), transparent)' }} />

          {/* Admin form */}
          {tab === 'admin' && (
            <form onSubmit={handleAdminSubmit} className="px-10 pb-8 space-y-5">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">Admin Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <svg className="w-4 h-4 text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password" autoFocus required
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all"
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.border = '1px solid rgba(200,169,110,0.45)'; e.target.style.boxShadow = '0 0 0 3px rgba(200,169,110,0.08)'; e.target.style.background = 'rgba(255,255,255,0.06)'; }}
                    onBlur={(e) => { e.target.style.border = '1px solid rgba(255,255,255,0.09)'; e.target.style.boxShadow = 'none'; e.target.style.background = 'rgba(255,255,255,0.04)'; }}
                  />
                </div>
              </div>
              {error && <ErrorBanner message={error} />}
              <SubmitButton loading={loading} label="Sign In to Dashboard" />
            </form>
          )}

          {/* Staff form */}
          {tab === 'staff' && (
            <form onSubmit={handleStaffSubmit} className="px-10 pb-8 space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">Username</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                  placeholder="Staff username" autoFocus required
                  className="w-full px-4 py-3.5 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all"
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.border = '1px solid rgba(200,169,110,0.45)'; e.target.style.background = 'rgba(255,255,255,0.06)'; }}
                  onBlur={(e) => { e.target.style.border = '1px solid rgba(255,255,255,0.09)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">Password</label>
                <input type="password" value={staffPassword} onChange={(e) => setStaffPassword(e.target.value)}
                  placeholder="Staff password" required
                  className="w-full px-4 py-3.5 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all"
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.border = '1px solid rgba(200,169,110,0.45)'; e.target.style.background = 'rgba(255,255,255,0.06)'; }}
                  onBlur={(e) => { e.target.style.border = '1px solid rgba(255,255,255,0.09)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }}
                />
              </div>
              {error && <ErrorBanner message={error} />}
              <SubmitButton loading={loading} label="Sign In as Staff" />
            </form>
          )}
        </div>

        <p className="text-center text-white/15 text-xs mt-6 tracking-wide">
          Prakriti 2026 · Event Admin System
        </p>
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-xs text-red-300"
      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
      <svg className="w-4 h-4 flex-shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {message}
    </div>
  );
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button type="submit" disabled={loading} className="w-full py-4 rounded-xl font-black text-sm tracking-wider transition-all"
      style={loading
        ? { background: 'rgba(46,125,50,0.3)', color: 'rgba(255,255,255,0.4)', cursor: 'not-allowed' }
        : { background: 'linear-gradient(135deg, #1a4a1a 0%, #2e7d32 100%)', color: '#fff', boxShadow: '0 4px 20px rgba(46,125,50,0.45)' }}>
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Authenticating…
        </span>
      ) : label}
    </button>
  );
}
