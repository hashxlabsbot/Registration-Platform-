import Link from 'next/link';
import { headers, cookies } from 'next/headers';
import LogoutButton from './LogoutButton';
import MobileNav from './MobileNav';
import { isValidSession, SESSION_COOKIE } from '@/lib/auth';
import { verifyStaffToken, STAFF_COOKIE } from '@/lib/staff-auth';

export const metadata = { title: 'Admin — Prakriti 2026' };

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

function navItems(role: 'admin' | 'volunteer'): NavItem[] {
  const all: NavItem[] = [
    {
      href: '/admin',
      label: 'Registrations',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      ),
    },
    {
      href: '/admin/scan',
      label: 'Scan QR',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
        </svg>
      ),
    },
    {
      href: '/admin/checkin',
      label: 'Check-in',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      href: '/admin/invites',
      label: 'Invite Codes',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      ),
    },
    {
      href: '/admin/payments',
      label: 'Payments',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
        </svg>
      ),
    },
    {
      href: '/admin/announcements',
      label: 'Announce',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.196-.138-.42-.23-.655-.23h-.75a4.5 4.5 0 110-9h.75c.236 0 .46-.09.655-.23m0 9.46c.48.337.988.517 1.51.517 1.657 0 3-1.343 3-3V6.75a3 3 0 00-3-3c-.522 0-1.03.18-1.51.517M10.34 15.84l-1.34.67m1.34-.67V6.16m0 0l-1.34-.67" />
        </svg>
      ),
    },
    {
      href: '/admin/recover',
      label: 'Recover',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
      ),
    },
    {
      href: '/admin/team',
      label: 'Team',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
    },
  ];

  if (role === 'volunteer') return all.filter((n) => n.href === '/admin/scan');
  return all;
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') ?? '';
  const isLoginPage = pathname === '/admin/login';

  // Determine role from cookies
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get(SESSION_COOKIE)?.value;
  const staffCookie = cookieStore.get(STAFF_COOKIE)?.value;
  let role: 'admin' | 'volunteer' = 'admin';
  if (!isValidSession(adminCookie)) {
    const staffInfo = verifyStaffToken(staffCookie);
    if (staffInfo?.role === 'volunteer') role = 'volunteer';
  }

  const items = navItems(role);

  return (
    <div className="min-h-screen" style={{ background: '#050d07' }}>
      {!isLoginPage && (
        <nav
          className="sticky top-0 z-50"
          style={{
            background: 'rgba(4, 10, 5, 0.92)',
            backdropFilter: 'blur(24px)',
            borderBottom: '1px solid rgba(200,169,110,0.1)',
            boxShadow: '0 1px 40px rgba(0,0,0,0.8)',
          }}
        >
          <div className="max-w-7xl mx-auto px-5 h-14 flex items-center justify-between">
            {/* Left: brand + nav */}
            <div className="flex items-center gap-6 min-w-0">
              {/* Mobile: hamburger (rendered inside MobileNav) + logo */}
              <MobileNav role={role} />

              {/* Logo */}
              <div className="flex items-center gap-2.5 flex-shrink-0">
                <div
                  className="w-7 h-7 rounded-lg hidden sm:flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #1a4a1a, #2e7d32)', boxShadow: '0 0 12px rgba(46,125,50,0.4)' }}
                >
                  <svg className="w-4 h-4 text-[#c8a96e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
                <span className="font-black text-[#c8a96e] text-sm tracking-wide hidden sm:block">Prakriti 2026</span>
              </div>

              <div className="h-4 w-px bg-white/10 hidden sm:block flex-shrink-0" />

              {/* Desktop links */}
              <div className="hidden sm:flex items-center gap-1 overflow-x-auto no-scrollbar">
                {items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all text-white/50 hover:text-white hover:bg-white/5 whitespace-nowrap"
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right: role badge + live + logout (desktop only) */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {role === 'volunteer' && (
                <span className="hidden sm:inline-block text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(99,179,237,0.1)', border: '1px solid rgba(99,179,237,0.2)', color: '#63b3ed' }}>
                  Volunteer
                </span>
              )}
              {role === 'admin' && (
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.15)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" style={{ boxShadow: '0 0 6px #4ade80' }} />
                  <span className="text-[10px] font-bold text-green-400/70 uppercase tracking-wider">Live</span>
                </div>
              )}
              <LogoutButton role={role} />
            </div>
          </div>
        </nav>
      )}
      <main>{children}</main>
    </div>
  );
}
