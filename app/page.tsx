import Link from 'next/link';
import {
  IIAEmblem, BlueprintGridOverlay, CompassRoseDecor, DraftingAnnotations,
  ArchitecturalSkyline, CornerMark, BuildingElevation,
  AmphitheaterIcon, CompassIcon, ArchIcon,
  ElevationIcon, ColumnsIcon, SkylineNightIcon,
} from '@/components/arch-elements';

const HIGHLIGHTS = [
  { num: '01', label: 'Panel Discussion',  desc: 'Expert-led dialogue on the future of sustainable architecture and the built environment.', icon: <AmphitheaterIcon /> },
  { num: '02', label: 'Technical Session', desc: 'Deep dives into green building technologies, materials, and structural innovation.', icon: <CompassIcon /> },
  { num: '03', label: 'Cultural Activity',  desc: "Celebrating India's rich architectural heritage through curated cultural performances.", icon: <ArchIcon /> },
  { num: '04', label: 'Presentation',       desc: 'Showcasing innovative and award-winning projects by leading architects and firms.', icon: <ElevationIcon /> },
  { num: '05', label: 'Exhibition',         desc: 'A curated display of eco-conscious architecture, planning models, and material studies.', icon: <ColumnsIcon /> },
  { num: '06', label: 'Gala Night',         desc: 'An evening of networking, recognition, and celebration with the architect community.', icon: <SkylineNightIcon /> },
];

const PRICING = [
  { type: 'IIA Member',      price: '₹500',   desc: 'Active IIA membership required' },
  { type: 'Non IIA Member',  price: '₹1,000', desc: 'Open to all architecture professionals' },
  { type: 'Visitor',         price: '₹2,000', desc: 'Students, enthusiasts & guests' },
  { type: 'Exhibitor',       price: '₹3,000', desc: 'Showcase your firm or products' },
];

const SPONSORS = [
  { name: 'Sponsor',             logo: '/sponsors/sponsor_peacock.png' },
  { name: 'Ledure',              logo: '/sponsors/sponsor_ledure.png' },
  { name: 'Supertech',           logo: '/sponsors/sponsor_supertech.png' },
  { name: 'Creative Facade',     logo: '/sponsors/sponsor_creativefacade.png' },
  { name: 'Roller Pest Control', logo: '/sponsors/sponsor_roller.png' },
  { name: 'Arya Niratech',       logo: '/sponsors/sponsor_arya.png' },
  { name: 'Jai Ambey',           logo: '/sponsors/sponsor_jaiambey.png' },
  { name: 'Mitra',               logo: '/sponsors/sponsor_mitra.png' },
  { name: 'Rover Industry',      logo: '/sponsors/sponsor_rover.png' },
  { name: 'Shriram',             logo: '/sponsors/sponsor_shriram.png' },
  { name: 'Skydecor',            logo: '/sponsors/sponsor_skydecor.png' },
  { name: 'Orientbell Tiles',    logo: '/sponsors/sponsor_orientbell.png' },
];

export default function Home() {
  return (
    <div className="min-h-screen" style={{
      backgroundColor: '#f5f7f2',
      backgroundImage: 'radial-gradient(circle, rgba(46,125,50,0.10) 1.2px, transparent 1.2px)',
      backgroundSize: '28px 28px',
    }}>

      {/* ─── Sticky Header ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/96 backdrop-blur-md border-b border-green-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-5 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <IIAEmblem size={36} />
            <div className="leading-tight">
              <p className="text-xs font-extrabold text-[#1a4a1a] uppercase tracking-wider">
                Indian Institute of Architects
              </p>
              <p className="text-[11px] text-[#2e7d32] font-semibold">Faridabad Centre</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-[#c8a96e] uppercase tracking-widest">Prakriti 2026</p>
              <p className="text-[11px] text-gray-400">20 June 2026 · Faridabad</p>
            </div>
            <Link href="/register"
              className="rounded-lg bg-[#2e7d32] px-4 py-2 text-xs font-bold text-white
                hover:bg-[#1a4a1a] transition-colors">
              Register Now
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative bg-[#1a4a1a] overflow-hidden">
        <BlueprintGridOverlay />
        <CompassRoseDecor />
        <DraftingAnnotations />

        <div className="relative max-w-7xl mx-auto px-6 pt-14 pb-6 text-center">
          <div className="inline-flex items-center gap-2 bg-[#c8a96e]/10 border border-[#c8a96e]/25 rounded-full px-5 py-1.5 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c8a96e]" />
            <span className="text-[#c8a96e] text-[11px] font-bold uppercase tracking-[0.2em]">
              Entry Ticket — Limited Registration
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#c8a96e]" />
          </div>

          <h1 className="text-[76px] sm:text-[108px] font-black text-[#c8a96e] leading-none tracking-tight">
            Prakriti
          </h1>
          <p className="text-[60px] sm:text-[90px] font-black text-white leading-none tracking-[0.12em] -mt-2">
            2026
          </p>
          <p className="mt-4 text-green-300 text-lg sm:text-xl font-medium">
            Architects for a Sustainable Tomorrow
          </p>
          <p className="mt-2 text-[#c8a96e]/60 text-xs uppercase tracking-[0.4em]">
            Design &nbsp;·&nbsp; Conserve &nbsp;·&nbsp; Restore
          </p>

          {/* Info pills */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {[
              { label: 'Date',  value: 'Saturday, 20 June 2026',                          icon: <CalIcon /> },
              { label: 'Time',  value: '3:00 PM Onwards',                                  icon: <ClockIcon /> },
              { label: 'Venue', value: 'Saffron Hall, Vardaan Group, Faridabad',            icon: <PinIcon /> },
            ].map((item) => (
              <div key={item.label}
                className="flex items-center gap-3 bg-white/8 border border-white/10 rounded-2xl px-5 py-3">
                <span className="text-[#c8a96e] shrink-0">{item.icon}</span>
                <div className="text-left">
                  <p className="text-[9px] text-green-400/80 uppercase tracking-widest">{item.label}</p>
                  <p className="text-sm font-bold text-white leading-tight">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Hero CTA */}
          <div className="mt-9">
            <Link href="/register"
              className="inline-flex items-center gap-2.5 bg-[#c8a96e] hover:bg-[#b8995e] text-[#1a4a1a]
                font-extrabold text-sm px-8 py-3.5 rounded-xl transition-colors shadow-lg shadow-[#c8a96e]/20">
              Secure Your Spot
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>

        <ArchitecturalSkyline />
      </section>

      {/* ─── Key Highlights ─────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <SectionTitle label="Key Highlights" sub="What to expect at Prakriti 2026" />
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {HIGHLIGHTS.map((h) => (
            <div key={h.num}
              className="relative bg-white rounded-2xl border border-green-100 shadow-sm p-6
                hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group overflow-hidden">
              <CornerMark pos="tl" />
              <CornerMark pos="br" />
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-xl bg-[#f1f8e9] border border-green-200 flex items-center
                  justify-center text-[#2e7d32] shrink-0 group-hover:bg-[#1a4a1a] group-hover:text-[#c8a96e]
                  group-hover:border-[#1a4a1a] transition-colors">
                  {h.icon}
                </div>
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-[10px] font-black text-green-200">{h.num}</span>
                    <h3 className="text-sm font-extrabold text-[#1a4a1a]">{h.label}</h3>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{h.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── About Section ──────────────────────────────────────────────────── */}
      <section className="bg-white border-y border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
          <div className="flex flex-col lg:flex-row gap-12 items-center">

            {/* Left: Building elevation illustration */}
            <div className="w-full lg:w-2/5 flex items-center justify-center">
              <div className="relative w-full max-w-[280px]">
                {/* Blueprint paper background */}
                <div className="absolute inset-0 rounded-2xl" style={{
                  background: 'linear-gradient(135deg, #f0f8f0 0%, #e8f5e9 100%)',
                  backgroundImage: 'radial-gradient(circle, rgba(46,125,50,0.08) 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                }} />
                <div className="relative p-6">
                  <BuildingElevation />
                </div>
              </div>
            </div>

            {/* Right: Text */}
            <div className="w-full lg:w-3/5">
              <SectionTitle label="About the Event" sub="" />
              <div className="mt-5 space-y-4 text-gray-600 text-sm leading-relaxed">
                <p>
                  <strong className="text-[#1a4a1a]">Prakriti 2026</strong> is a landmark annual gathering
                  convened by the Indian Institute of Architects — Faridabad Centre, bringing together
                  architects, urban designers, sustainability professionals, and students for a full day
                  of meaningful exchange.
                </p>
                <p>
                  The 2026 edition is themed{' '}
                  <em className="text-[#2e7d32] font-semibold not-italic">
                    "Architects for a Sustainable Tomorrow"
                  </em>{' '}
                  — exploring how the built environment can lead the transition toward greener cities,
                  energy-efficient structures, and nature-integrated design.
                </p>
                <p>
                  From panel discussions and technical sessions to a cultural evening and gala night,
                  Prakriti 2026 offers an unparalleled platform to learn, connect, and celebrate the
                  art and science of architecture.
                </p>
              </div>

              {/* Organiser info */}
              <div className="mt-7 flex items-center gap-4 p-4 rounded-xl bg-[#f9fdf8] border border-green-100">
                <IIAEmblem size={44} />
                <div>
                  <p className="text-sm font-extrabold text-[#1a4a1a]">Indian Institute of Architects</p>
                  <p className="text-xs text-gray-500 mt-0.5">Faridabad Centre</p>
                  <p className="text-xs text-[#2e7d32] mt-0.5">iafaridabadcentre@gmail.com</p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Link href="/register"
                  className="rounded-xl bg-[#1a4a1a] px-6 py-3 text-sm font-bold text-white
                    hover:bg-[#2e7d32] transition-colors">
                  Register Now →
                </Link>
                <a href="https://www.indianinstituteofarchitects.com" target="_blank" rel="noopener noreferrer"
                  className="rounded-xl border border-green-200 bg-white px-6 py-3 text-sm font-semibold
                    text-[#2e7d32] hover:border-[#1a4a1a] hover:text-[#1a4a1a] transition-colors">
                  Visit IIA Website
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Registration CTA ───────────────────────────────────────────────── */}
      <section className="relative bg-[#1a4a1a] overflow-hidden">
        <BlueprintGridOverlay />
        <CornerMark pos="tl" color="gold" />
        <CornerMark pos="tr" color="gold" />
        <CornerMark pos="bl" color="gold" />
        <CornerMark pos="br" color="gold" />

        <div className="relative max-w-7xl mx-auto px-6 py-14">
          <div className="text-center mb-10">
            <p className="text-[11px] font-bold text-[#c8a96e] uppercase tracking-[0.3em]">Limited Seats</p>
            <h2 className="mt-2 text-3xl font-extrabold text-white">Secure Your Spot at Prakriti 2026</h2>
            <p className="mt-2 text-green-300 text-sm">
              Saturday, 20 June 2026 &nbsp;·&nbsp; 3:00 PM &nbsp;·&nbsp; Saffron Hall, Vardaan Group, Faridabad
            </p>
          </div>

          {/* Pricing grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {PRICING.map((p) => (
              <div key={p.type}
                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur px-5 py-5 text-center
                  hover:bg-white/10 hover:border-[#c8a96e]/40 transition-all">
                <p className="text-xs font-bold text-green-300 uppercase tracking-widest">{p.type}</p>
                <p className="mt-2 text-3xl font-black text-[#c8a96e]">{p.price}</p>
                <p className="mt-1 text-[10px] text-green-500 leading-tight">{p.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/register"
              className="inline-flex items-center gap-2.5 bg-[#c8a96e] hover:bg-[#b8995e] text-[#1a4a1a]
                font-extrabold text-base px-10 py-4 rounded-xl transition-colors shadow-xl shadow-black/20">
              Register Now
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <p className="mt-3 text-xs text-green-500">Pay via UPI · Confirmation email sent instantly</p>
          </div>
        </div>
      </section>

      {/* ─── Sponsors ───────────────────────────────────────────────────────── */}
      <section className="bg-white border-t border-green-100 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-[#1a4a1a]">Our Proud Sponsors</p>
            <div className="mt-2 h-0.5 w-14 bg-[#c8a96e] mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {SPONSORS.map((s) => (
              <div key={s.name}
                title={s.name}
                className="rounded-2xl border border-green-100 bg-[#fafdf8] p-2 flex items-center justify-center
                  aspect-square hover:border-[#2e7d32] hover:shadow-md hover:-translate-y-0.5
                  transition-all duration-200 overflow-hidden group">
                <img
                  src={s.logo}
                  alt={s.name}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="bg-[#1a4a1a] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #c8a96e 0, #c8a96e 1px, transparent 0, transparent 50%)',
          backgroundSize: '18px 18px',
        }} />
        <div className="relative max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-3">
              <IIAEmblem size={40} variant="light" />
              <div>
                <p className="text-white font-bold text-sm">Indian Institute of Architects</p>
                <p className="text-green-400 text-xs">Faridabad Centre</p>
              </div>
            </div>
            <div className="text-center sm:text-right space-y-0.5">
              <p className="text-[#c8a96e] text-xs font-semibold">iafaridabadcentre@gmail.com</p>
              <p className="text-green-400 text-xs">www.indianinstituteofarchitects.com</p>
            </div>
          </div>
          <div className="mt-6 pt-5 border-t border-[#2e7d32]/40 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-[#c8a96e] text-sm font-extrabold tracking-wide">
              Let&apos;s Design a Better Future. Together.
            </p>
            <p className="text-green-700 text-xs">© 2026 IIA Faridabad Centre. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}

// ─── Section title ────────────────────────────────────────────────────────────
function SectionTitle({ label, sub }: { label: string; sub: string }) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="h-5 w-1 rounded-full bg-[#c8a96e]" />
        <h2 className="text-xl font-extrabold text-[#1a4a1a] tracking-tight">{label}</h2>
      </div>
      {sub && <p className="mt-1 text-sm text-gray-400 ml-4">{sub}</p>}
    </div>
  );
}

// ─── Utility icons ────────────────────────────────────────────────────────────
function CalIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}
