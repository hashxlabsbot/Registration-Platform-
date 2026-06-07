'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export default function MobileNav({ items, role }: { items: NavItem[]; role: 'admin' | 'volunteer' }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Hamburger button — only on mobile */}
      <button
        onClick={() => setOpen(true)}
        className="sm:hidden flex items-center justify-center w-8 h-8 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all"
        aria-label="Open menu"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm sm:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-out drawer */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-72 sm:hidden flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          background: 'rgba(4, 10, 5, 0.98)',
          backdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(200,169,110,0.12)',
          boxShadow: '4px 0 40px rgba(0,0,0,0.8)',
        }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 h-14 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #1a4a1a, #2e7d32)', boxShadow: '0 0 12px rgba(46,125,50,0.4)' }}
            >
              <svg className="w-4 h-4 text-[#c8a96e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <span className="font-black text-[#c8a96e] text-sm tracking-wide">Prakriti 2026</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Role badge */}
        <div className="px-5 pt-4 pb-2">
          {role === 'volunteer' ? (
            <span className="inline-block text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(99,179,237,0.1)', border: '1px solid rgba(99,179,237,0.2)', color: '#63b3ed' }}>
              Volunteer
            </span>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.15)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" style={{ boxShadow: '0 0 6px #4ade80' }} />
              <span className="text-[10px] font-bold text-green-400/70 uppercase tracking-wider">Live</span>
            </div>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          {items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all mb-1 ${
                  isActive
                    ? 'text-[#c8a96e] bg-[#c8a96e]/10'
                    : 'text-white/55 hover:text-white hover:bg-white/5'
                }`}
                style={isActive ? { border: '1px solid rgba(200,169,110,0.15)' } : { border: '1px solid transparent' }}
              >
                <span className={isActive ? 'text-[#c8a96e]' : 'text-white/40'}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="border-t border-white/5 mx-5" />

        {/* Sign out at bottom */}
        <div className="px-3 py-4">
          <SignOutButton role={role} />
        </div>
      </div>
    </>
  );
}

function SignOutButton({ role }: { role: 'admin' | 'volunteer' }) {
  async function handleLogout() {
    const endpoint = role === 'volunteer' ? '/api/admin/staff-auth' : '/api/admin/auth';
    await fetch(endpoint, { method: 'DELETE' });
    window.location.replace('/admin/login');
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-white/35 hover:text-red-400 hover:bg-red-500/10 transition-all"
      style={{ border: '1px solid transparent' }}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
      </svg>
      Sign Out
    </button>
  );
}
