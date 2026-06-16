'use client';

import { useState, useEffect, useMemo } from 'react';

interface Member {
  name:     string;
  relation: string;
  email:    string;
  phone:    string;
}

interface Registration {
  bookingId:        string;
  name:             string;
  email:            string;
  phone:            string;
  organization:     string;
  designation:      string;
  registrationType: string;
  amount:           number;
  utrNumber:        string;
  registeredAt:     string;
  checkedIn:        boolean;
  checkinTime:      string;
  district:         string;
  state:            string;
  members:          Member[];
}

const PAGE_SIZE = 25;

// Map raw registration types to the label shown in the UI.
function displayType(t: string): string {
  return t === 'Non-Architect' || t === 'Non - Architect' ? 'Delegate' : t;
}

export default function AdminPage() {
  const [regs, setRegs] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'checked' | 'pending'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [locationSort, setLocationSort] = useState<'none' | 'asc' | 'desc'>('none');
  const [page, setPage] = useState(1);
  const [role, setRole] = useState<string>('admin');

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/registrations');
      if (res.ok) {
        const data = await res.json();
        setRegs(data.registrations);
        if (data.role) setRole(data.role);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Distinct registration types present in the data (raw values, sorted by label).
  const typeOptions = useMemo(() => {
    const set = new Set(regs.map((r) => r.registrationType).filter(Boolean));
    return Array.from(set).sort((a, b) => displayType(a).localeCompare(displayType(b)));
  }, [regs]);

  // Distinct locations (districts) derived from the entries, alphabetically sorted.
  const locationOptions = useMemo(() => {
    const set = new Set(regs.map((r) => (r.district ?? '').trim()).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [regs]);

  const filtered = useMemo(() => {
    let list = regs;
    if (filter === 'checked') list = list.filter((r) => r.checkedIn);
    if (filter === 'pending') list = list.filter((r) => !r.checkedIn);
    if (typeFilter !== 'all') list = list.filter((r) => r.registrationType === typeFilter);
    if (locationFilter !== 'all') list = list.filter((r) => (r.district ?? '').trim() === locationFilter);
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
    if (locationSort !== 'none') {
      list = [...list].sort((a, b) => {
        const cmp = (a.district ?? '').localeCompare(b.district ?? '');
        return locationSort === 'asc' ? cmp : -cmp;
      });
    }
    return list;
  }, [regs, search, filter, typeFilter, locationFilter, locationSort]);

  // Reset to the first page whenever the result set changes.
  useEffect(() => {
    setPage(1);
  }, [search, filter, typeFilter, locationFilter, locationSort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage],
  );

  const isAdmin = role === 'admin';
  const checkedInCount = regs.filter((r) => r.checkedIn).length;
  const totalRevenue = regs.reduce((s, r) => s + r.amount, 0);
  const totalAttendees = regs.reduce((s, r) => s + 1 + (r.members?.length ?? 0), 0);
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
        <div className={`grid grid-cols-2 gap-4 mb-6 ${isAdmin ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
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
            label="Total Attendees"
            value={loading ? '—' : totalAttendees}
            icon={<AttendeesIcon />}
            gradFrom="#2a1e5f"
            gradTo="#180f40"
            borderColor="rgba(167,139,250,0.2)"
            glowColor="rgba(167,139,250,0.12)"
            valueColor="#a78bfa"
            sub={loading || totalAttendees === regs.length ? undefined : `incl. ${totalAttendees - regs.length} add-on members`}
            subColor="#a78bfa"
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
          {isAdmin && (
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
          )}
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

          {/* Registration type filter */}
          <FilterSelect
            value={typeFilter}
            onChange={setTypeFilter}
            allLabel="All Types"
            options={typeOptions.map((t) => ({ value: t, label: displayType(t) }))}
          />

          {/* Location (district) filter */}
          <FilterSelect
            value={locationFilter}
            onChange={setLocationFilter}
            allLabel="All Locations"
            options={locationOptions.map((l) => ({ value: l, label: l }))}
          />

          {/* Location sort toggle */}
          <button
            onClick={() =>
              setLocationSort((s) => (s === 'none' ? 'asc' : s === 'asc' ? 'desc' : 'none'))
            }
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-all"
            style={
              locationSort === 'none'
                ? { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }
                : { background: 'linear-gradient(135deg, #1a4a1a, #2e7d32)', border: '1px solid rgba(74,222,128,0.25)', color: '#fff' }
            }
            title="Sort by location"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v18M21 16.5L16.5 21m0 0L12 16.5m4.5 4.5V3" />
            </svg>
            Location {locationSort === 'asc' ? '↑' : locationSort === 'desc' ? '↓' : ''}
          </button>

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

          {/* Export Excel */}
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
            Attendee List
          </a>

          {/* Download all ticket PDFs as ZIP */}
          <a
            href="/api/admin/download-tickets-zip"
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-all text-white"
            style={{
              background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
              boxShadow: '0 2px 16px rgba(37,99,235,0.3)',
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M12 8.25v6m-7.5-6.75h15" />
            </svg>
            All Tickets ZIP
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
                    <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-white/25 hidden lg:table-cell">Location</th>
                    {isAdmin && <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-white/25 hidden md:table-cell">Amount</th>}
                    <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-white/25 hidden lg:table-cell">Phone</th>
                    <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-white/25 hidden lg:table-cell">Registered</th>
                    <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-white/25">Status</th>
                    <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-white/25 hidden md:table-cell">Ticket</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((r, i) => (
                    <TableRow key={r.bookingId} r={r} i={i} isAdmin={isAdmin} />
                  ))}
                </tbody>
              </table>

              {/* Footer */}
              <div
                className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3"
                style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
              >
                <p className="text-xs text-white/25">
                  Showing{' '}
                  <span className="text-white/50 font-bold">
                    {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–
                    {Math.min(currentPage * PAGE_SIZE, filtered.length)}
                  </span>{' '}
                  of{' '}
                  <span className="text-white/50 font-bold">{filtered.length}</span>
                  {filtered.length !== regs.length && (
                    <> (filtered from <span className="text-white/40 font-bold">{regs.length}</span>)</>
                  )}
                </p>

                <div className="flex items-center gap-3">
                  {totalPages > 1 && (
                    <div className="flex items-center gap-1.5">
                      <PageButton
                        label="Prev"
                        disabled={currentPage <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      />
                      <span className="text-xs text-white/40 font-bold px-1">
                        {currentPage} / {totalPages}
                      </span>
                      <PageButton
                        label="Next"
                        disabled={currentPage >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"
                      style={{ boxShadow: '0 0 6px #4ade80' }}
                    />
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Live</span>
                  </div>
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
function TableRow({ r, i, isAdmin }: { r: Registration; i: number; isAdmin: boolean }) {
  const [hovered,    setHovered]    = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [viewing,    setViewing]    = useState(false);
  const [resending,  setResending]  = useState(false);
  const [expanded,   setExpanded]   = useState(false);
  const base = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)';
  const hasMembers = r.members && r.members.length > 0;

  const displayRegType = displayType(r.registrationType);

  async function fetchTicketBlob(
    data: { bookingId: string; name: string; email: string; phone: string;
            organization: string; designation: string; registrationType: string;
            totalAmount: number; utrNumber: string }
  ): Promise<Blob> {
    const res = await fetch('/api/ticket', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed');
    return res.blob();
  }

  async function viewTicket() {
    // Open a blank tab synchronously so popup blockers don't interfere with the async fetch
    const tab = window.open('', '_blank');
    if (!tab) {
      alert('Please allow popups for this site to view tickets.');
      return;
    }
    setViewing(true);
    try {
      const blob = await fetchTicketBlob({
        bookingId: r.bookingId, name: r.name, email: r.email, phone: r.phone,
        organization: r.organization, designation: r.designation,
        registrationType: r.registrationType, totalAmount: r.amount, utrNumber: r.utrNumber,
      });
      const url = URL.createObjectURL(blob);
      tab.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      tab.close();
      alert('Could not load ticket preview.');
    } finally {
      setViewing(false);
    }
  }

  async function downloadTicket(
    data: { bookingId: string; name: string; email: string; phone: string;
            organization: string; designation: string; registrationType: string;
            totalAmount: number; utrNumber: string },
    setLoading?: (v: boolean) => void,
  ) {
    setLoading ? setLoading(true) : setDownloading(true);
    try {
      const blob = await fetchTicketBlob(data);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `prakriti2026-ticket-${data.bookingId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      alert('Could not download ticket.');
    } finally {
      setLoading ? setLoading(false) : setDownloading(false);
    }
  }

  async function resendTicket() {
    if (!r.email) {
      alert('No email on file for this attendee.');
      return;
    }
    if (!confirm(`Resend ticket to ${r.name} (${r.email})?`)) return;
    setResending(true);
    try {
      const res = await fetch('/api/admin/resend-ticket', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ bookingId: r.bookingId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed');
      alert(`Ticket sent to ${data.sentTo || r.email}.`);
    } catch (err) {
      alert(`Could not resend ticket. ${err instanceof Error ? err.message : ''}`.trim());
    } finally {
      setResending(false);
    }
  }

  return (
    <>
      <tr
        style={{
          borderBottom: expanded ? 'none' : '1px solid rgba(255,255,255,0.04)',
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
          <div className="flex items-start gap-2">
            <div>
              <p className="font-semibold text-white text-sm leading-snug">{r.name}</p>
              <p className="text-xs text-white/30 mt-0.5">{r.email}</p>
              {/* Mobile/Tablet action buttons */}
              <div className="flex md:hidden items-center gap-1.5 mt-2">
                <TicketButton label="View" loading={viewing} loadingLabel="…" color="#63b3ed" colorAlpha="rgba(99,179,237" onClick={viewTicket} disabled={viewing || downloading} />
                <TicketButton
                  label="PDF" loading={downloading} loadingLabel="…" color="#c8a96e" colorAlpha="rgba(200,169,110"
                  onClick={() => downloadTicket({ bookingId: r.bookingId, name: r.name, email: r.email, phone: r.phone,
                    organization: r.organization, designation: r.designation, registrationType: r.registrationType,
                    totalAmount: r.amount, utrNumber: r.utrNumber })}
                  disabled={downloading || viewing}
                  icon={<svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v13m0 0l-4-4m4 4l4-4M3 21h18" /></svg>}
                />
                {isAdmin && (
                  <TicketButton
                    label="Send" loading={resending} loadingLabel="…" color="#4ade80" colorAlpha="rgba(74,222,128"
                    onClick={resendTicket} disabled={resending}
                    icon={<svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                  />
                )}
              </div>
            </div>
            {hasMembers && (
              <button
                onClick={() => setExpanded((v) => !v)}
                title={expanded ? 'Hide members' : 'Show additional members'}
                className="shrink-0 mt-0.5 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full transition-all"
                style={{
                  background: expanded ? 'rgba(200,169,110,0.2)' : 'rgba(200,169,110,0.1)',
                  color: '#c8a96e',
                  border: '1px solid rgba(200,169,110,0.25)',
                }}
              >
                +{r.members.length}
                <svg
                  className="w-2.5 h-2.5 transition-transform"
                  style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
        </td>

        <td className="px-5 py-4 hidden sm:table-cell">
          <span
            className="inline-block text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(46,125,50,0.18)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }}
          >
            {displayRegType}
          </span>
        </td>

        <td className="px-5 py-4 hidden lg:table-cell">
          {r.district?.trim() ? (
            <div>
              <p className="text-xs text-white/55">{r.district}</p>
              {r.state?.trim() && <p className="text-[10px] text-white/25">{r.state}</p>}
            </div>
          ) : (
            <span className="text-xs text-white/15">—</span>
          )}
        </td>

        {isAdmin && (
          <td className="px-5 py-4 hidden md:table-cell">
            <span className="text-sm font-bold text-white/75">₹{r.amount.toLocaleString('en-IN')}</span>
          </td>
        )}

        <td className="px-5 py-4 hidden lg:table-cell text-xs text-white/35">{r.phone}</td>
        <td className="px-5 py-4 hidden lg:table-cell text-xs text-white/25">{r.registeredAt}</td>

        <td className="px-5 py-4">
          {r.checkedIn ? (
            <div>
              <span
                className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.22)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" style={{ boxShadow: '0 0 6px #4ade80' }} />
                Checked In
              </span>
              {r.checkinTime && <p className="text-[10px] text-white/20 mt-1">{r.checkinTime}</p>}
            </div>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.28)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white/20 flex-shrink-0" />
              Pending
            </span>
          )}
        </td>

        <td className="px-5 py-4 hidden md:table-cell">
          <div className="flex items-center gap-1.5">
            <TicketButton label="View" loading={viewing} loadingLabel="…" color="#63b3ed" colorAlpha="rgba(99,179,237" onClick={viewTicket} disabled={viewing || downloading} />
            <TicketButton
              label="PDF" loading={downloading} loadingLabel="…" color="#c8a96e" colorAlpha="rgba(200,169,110"
              onClick={() => downloadTicket({ bookingId: r.bookingId, name: r.name, email: r.email, phone: r.phone,
                organization: r.organization, designation: r.designation, registrationType: r.registrationType,
                totalAmount: r.amount, utrNumber: r.utrNumber })}
              disabled={downloading || viewing}
              icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v13m0 0l-4-4m4 4l4-4M3 21h18" /></svg>}
            />
            {isAdmin && (
              <TicketButton
                label="Send" loading={resending} loadingLabel="…" color="#4ade80" colorAlpha="rgba(74,222,128"
                onClick={resendTicket} disabled={resending}
                icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
              />
            )}
          </div>
        </td>
      </tr>

      {/* ── Expanded member rows ──────────────────────────────────────────────── */}
      {hasMembers && expanded && (
        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(200,169,110,0.03)' }}>
          <td colSpan={9} className="px-5 pb-4 pt-2">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#c8a96e] mb-3">
              Additional Members ({r.members.length})
            </p>
            <div className="grid gap-2">
              {r.members.map((m, idx) => (
                <MemberRow
                  key={idx}
                  m={m}
                  bookingId={`${r.bookingId}-M${idx + 1}`}
                  organization={r.organization}
                  utrNumber={r.utrNumber}
                  onDownload={downloadTicket}
                />
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Member row inside expanded section ───────────────────────────────────────
function MemberRow({
  m, bookingId, organization, utrNumber, onDownload,
}: {
  m: Member;
  bookingId: string;
  organization: string;
  utrNumber: string;
  onDownload: (data: { bookingId: string; name: string; email: string; phone: string;
    organization: string; designation: string; registrationType: string;
    totalAmount: number; utrNumber: string }, setLoading?: (v: boolean) => void) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg px-3 py-2"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
        <span className="font-bold text-white">{m.name}</span>
        <span
          className="text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full"
          style={{ background: 'rgba(200,169,110,0.12)', color: '#c8a96e', border: '1px solid rgba(200,169,110,0.2)' }}
        >
          {m.relation}
        </span>
        <span className="text-white/35">{m.email}</span>
        <span className="text-white/25">{m.phone}</span>
      </div>
      <button
        onClick={() => onDownload({
          bookingId, name: m.name, email: m.email, phone: m.phone,
          organization, designation: m.relation, registrationType: 'Non-Architect',
          totalAmount: 0, utrNumber,
        }, setLoading)}
        disabled={loading}
        className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wide px-2 py-1 rounded-md transition-all disabled:opacity-40"
        style={{ background: 'rgba(200,169,110,0.1)', color: '#c8a96e', border: '1px solid rgba(200,169,110,0.18)' }}
      >
        {loading
          ? <><svg className="w-2.5 h-2.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg> …</>
          : <><svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v13m0 0l-4-4m4 4l4-4M3 21h18"/></svg> PDF</>
        }
      </button>
    </div>
  );
}

// ── Reusable ticket action button ─────────────────────────────────────────────
function TicketButton({ label, loading, loadingLabel, color, colorAlpha, onClick, disabled, icon }: {
  label: string; loading: boolean; loadingLabel: string;
  color: string; colorAlpha: string; onClick: () => void; disabled: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-40"
      style={{ background: loading ? `${colorAlpha},0.08)` : `${colorAlpha},0.12)`, color, border: `1px solid ${colorAlpha},0.2)` }}
    >
      {loading
        ? <><svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>{loadingLabel}</>
        : <>{icon ?? <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>}{label}</>
      }
    </button>
  );
}

// ── Filter dropdown ───────────────────────────────────────────────────────────
function FilterSelect({
  value, onChange, allLabel, options,
}: {
  value: string;
  onChange: (v: string) => void;
  allLabel: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3.5 pr-9 py-2.5 rounded-xl text-xs font-bold text-white/70 outline-none cursor-pointer transition-all"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <option value="all" style={{ background: '#0a160c', color: '#fff' }}>{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ background: '#0a160c', color: '#fff' }}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        className="w-3.5 h-3.5 text-white/30 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}

// ── Pagination button ─────────────────────────────────────────────────────────
function PageButton({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-1.5 text-xs font-bold rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed text-white/60 hover:text-white"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {label}
    </button>
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
      className="relative rounded-2xl p-3.5 sm:p-5 overflow-hidden"
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
        className={`font-black text-white ${smallValue ? 'text-base sm:text-xl' : 'text-lg sm:text-2xl'}`}
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

function AttendeesIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
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
