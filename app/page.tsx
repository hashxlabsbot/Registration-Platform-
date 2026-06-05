import Link from 'next/link';
import {
  IIAEmblem, BlueprintGridOverlay, CornerMark,
  AmphitheaterIcon, CompassIcon, ArchIcon,
  ElevationIcon, ColumnsIcon, SkylineNightIcon,
} from '@/components/arch-elements';

const HIGHLIGHTS = [
  { num: '01', label: 'Panel Discussion',  desc: 'Expert-led dialogue on the future of sustainable architecture and the built environment.', icon: <AmphitheaterIcon />, img: '/panel_discussion.png' },
  { num: '02', label: 'Technical Session', desc: 'Deep dives into green building technologies, materials, and structural innovation.',        icon: <CompassIcon />,      img: '/tech_session.png' },
  { num: '03', label: 'Cultural Activity',  desc: "Celebrating India's rich architectural heritage through curated cultural performances.",    icon: <ArchIcon />,         img: '/cultural_dance.png' },
  { num: '04', label: 'Presentation',       desc: 'Showcasing innovative and award-winning projects by leading architects and firms.',         icon: <ElevationIcon />,    img: '/presentation.png' },
  { num: '05', label: 'Exhibition',         desc: 'A curated display of eco-conscious architecture, planning models, and material studies.',   icon: <ColumnsIcon />,      img: '/exhibition.png' },
  { num: '06', label: 'Gala Night',         desc: 'An evening of networking, recognition, and celebration with the architect community.',      icon: <SkylineNightIcon />, img: '/gala_night.png' },
];

const PRICING = [
  { type: 'Architect – IIA Member',     price: '₹1',      desc: 'Active IIA membership required' },
  { type: 'Architect – Non-IIA Member', price: '₹1,000',  desc: 'Open to all architecture professionals' },
  { type: 'Non-Architect Delegate',     price: '₹2,500',  desc: 'Industry professionals & guests' },
  { type: 'Additional Member',          price: '₹1,000',  desc: 'Per member (Spouse or Friend only) added by an architect registrant' },
];

const SPONSORS = [
  { name: 'Bharat Steel',                    logo: '/sponsors/sponsor_bharat-steel.png' },
  { name: 'Nebastar',                        logo: '/sponsors/sponsor_nebastar.png' },
  { name: 'Arora Developers P.P. Ltd.',      logo: '/sponsors/sponsor_arora-developers.png' },
  { name: 'Mitra',                           logo: '/sponsors/sponsor_mitra.png' },
  { name: 'NPYA Interact',                   logo: '/sponsors/sponsor_npya-interact.png' },
  { name: 'Ali Empire',                      logo: '/sponsors/sponsor_ali-empire.png' },
  { name: 'Saibo5 Enterprises',              logo: '/sponsors/sponsor_saibo5-enterprises.png' },
  { name: 'Greenlam Laminates',              logo: '/sponsors/sponsor_greenlam.png' },
  { name: 'Rover Industry',                  logo: '/sponsors/sponsor_rover-industry.png' },
  { name: 'Roller Pest Control',             logo: '/sponsors/sponsor_roller-pest-control.png' },
  { name: 'Jai Ambe Developers',             logo: '/sponsors/sponsor_jai-ambe-developers.png' },
  { name: 'Birla Pivot',                     logo: '/sponsors/sponsor_birla-pivot.png' },
  { name: 'Supertech',                       logo: '/sponsors/sponsor_supertech.png' },
  { name: 'Excellence Office Furniture',     logo: '/sponsors/sponsor_excellence-furniture.png' },
  { name: 'Skydecor',                        logo: '/sponsors/sponsor_skydecor.png' },
  { name: 'Creative Facade Art & Glass',     logo: '/sponsors/sponsor_creative-facade.png' },
  { name: 'Ledure Smart Lighting',           logo: '/sponsors/sponsor_ledure.png' },
  { name: 'Orientbell Tiles',                logo: '/sponsors/sponsor_orientbell.png' },
  { name: 'SRTS Complete Construction',      logo: '/sponsors/sponsor_srts.png' },
  { name: 'Supertech India Pvt. Ltd.',       logo: '/sponsors/sponsor_supertech-india.png' },
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          {/* Logo + name */}
          <div className="flex items-center shrink-0 min-w-0">
            <IIAEmblem size={220} />
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-[#c8a96e] uppercase tracking-widest">Prakriti 2026</p>
              <p className="text-[11px] text-gray-400">20 June 2026 · Faridabad</p>
            </div>
            <Link
              href="/register"
              className="rounded-lg bg-[#2e7d32] px-3 py-2 sm:px-4 text-xs font-bold text-white
                hover:bg-[#1a4a1a] active:scale-95 transition-all whitespace-nowrap"
            >
              Register Now
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-[90vh] sm:min-h-[80vh] overflow-hidden">

        {/* Left panel */}
        <div className="relative z-10 w-full lg:w-[50%] flex items-center bg-[#f4f7f0] px-6 sm:px-10 xl:px-16 py-12 sm:py-20">
          <div className="w-full max-w-lg mx-auto lg:mx-0">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 border border-[#2e7d32]/40 rounded-full px-3 py-1.5 mb-5">
              <span className="h-2 w-2 rounded-full bg-[#2e7d32] animate-pulse shrink-0" />
              <span className="text-[#1a4a1a] text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.12em]">
                Entry Ticket — Limited Registration
              </span>
            </div>

            {/* Prakriti Title image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/Hindi-prakriti.png"
              alt="प्रकृति 2026"
              className="h-[160px] sm:h-[200px] lg:h-[240px] w-auto -mb-2"
            />

            <p className="mt-3 text-[#2e7d32] text-base sm:text-lg lg:text-xl font-semibold leading-snug">
              An Architects&apos; Meet &ldquo;For a Sustainable Tomorrow&rdquo;
            </p>
            <p className="mt-1.5 text-[#1a4a1a]/45 text-[10px] sm:text-[11px] uppercase tracking-[0.25em]">
              Design&nbsp;·&nbsp;Conserve&nbsp;·&nbsp;Restore
            </p>

            {/* Info rows */}
            <div className="mt-6 space-y-3.5">
              {[
                { label: 'Date',  value: 'Saturday, 20 June 2026',                icon: <CalIcon /> },
                { label: 'Time',  value: '3:00 PM Onwards',                        icon: <ClockIcon /> },
                { label: 'Venue', value: 'Saffron Hall, Vardaan Grand, Faridabad', icon: <PinIcon /> },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <span className="text-[#2e7d32] shrink-0 mt-0.5">{item.icon}</span>
                  <div>
                    <p className="text-[9px] text-[#2e7d32]/60 uppercase tracking-widest leading-none mb-0.5">{item.label}</p>
                    <p className="text-sm font-semibold text-[#1a4a1a] leading-tight">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-8 flex gap-3">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2.5 bg-[#1a4a1a] hover:bg-[#2e7d32]
                  active:scale-95 text-white font-bold text-sm px-7 py-3.5 rounded-xl
                  transition-all shadow-md shadow-[#1a4a1a]/20"
              >
                Secure Your Spot
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Right panel — desktop hero image */}
        <div className="hidden lg:block absolute right-0 top-0 w-[50%] h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero_forest_city.png"
            alt="Prakriti 2026 — Forest City"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#f4f7f0] to-transparent pointer-events-none" />
        </div>

        {/* Mobile hero image — tinted overlay */}
        <div className="lg:hidden absolute inset-0 pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero_forest_city.png"
            alt=""
            className="w-full h-full object-cover object-center opacity-[0.08]"
          />
        </div>
      </section>

      {/* ─── Key Highlights ─────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
        <SectionTitle label="Key Highlights" sub="What to expect at Prakriti 2026" />
        <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {HIGHLIGHTS.map((h) => (
            <div
              key={h.num}
              className="relative bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden
                hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
            >
              {/* Photo thumbnail */}
              <div className="relative h-40 sm:h-44 overflow-hidden bg-[#1a4a1a]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={h.img}
                  alt={h.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a4a1a]/80 via-[#1a4a1a]/20 to-transparent" />
                <span className="absolute top-3 left-3.5 text-[11px] font-black text-white/50 font-mono">{h.num}</span>
                <div className="absolute bottom-3 right-3 h-9 w-9 rounded-xl bg-white/15 backdrop-blur-sm
                  border border-white/20 flex items-center justify-center text-white
                  group-hover:bg-[#c8a96e]/80 group-hover:border-[#c8a96e] group-hover:text-[#1a4a1a] transition-colors">
                  {h.icon}
                </div>
              </div>
              {/* Text */}
              <div className="p-4 sm:p-5">
                <h3 className="text-sm font-extrabold text-[#1a4a1a]">{h.label}</h3>
                <p className="mt-1 text-xs text-gray-500 leading-relaxed">{h.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── About Section ──────────────────────────────────────────────────── */}
      <section className="bg-white border-y border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">

            {/* Photo */}
            <div className="w-full lg:w-2/5">
              <div className="relative rounded-2xl overflow-hidden h-64 sm:h-80 shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/sustainability.png"
                  alt="Sustainability — Design, Conserve, Restore"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a4a1a]/75 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                  <p className="text-white font-extrabold text-sm sm:text-base leading-tight">
                    Design · Conserve · Restore
                  </p>
                  <p className="text-green-300 text-xs mt-0.5">Architecture for a sustainable tomorrow</p>
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="w-full lg:w-3/5">
              <SectionTitle label="About the Event" sub="" />
              <div className="mt-4 sm:mt-5 space-y-3 sm:space-y-4 text-gray-600 text-sm leading-relaxed">
                <p>
                  <strong className="text-[#1a4a1a]">Prakriti 2026</strong> is a landmark annual gathering
                  convened by The Indian Institute of Architects — Faridabad Centre, bringing together
                  architects, urban designers, sustainability professionals, and students for a full day
                  of meaningful exchange.
                </p>
                <p>
                  The 2026 edition is themed{' '}
                  <em className="text-[#2e7d32] font-semibold not-italic">
                    &ldquo;Architects for a Sustainable Tomorrow&rdquo;
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

              {/* Organiser */}
              <div className="mt-6 sm:mt-7 flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-[#f9fdf8] border border-green-100">
                <IIAEmblem size={44} />
                <div>
                  <p className="text-sm font-extrabold text-[#1a4a1a]">The Indian Institute of Architects</p>
                  <p className="text-xs text-gray-500 mt-0.5">Faridabad Centre</p>
                  <p className="text-xs text-[#2e7d32] mt-0.5">iafaridabadcentre@gmail.com</p>
                </div>
              </div>

              <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/register"
                  className="rounded-xl bg-[#1a4a1a] px-5 sm:px-6 py-3 text-sm font-bold text-white
                    hover:bg-[#2e7d32] active:scale-95 transition-all text-center"
                >
                  Register Now →
                </Link>
                <a
                  href="https://www.indianinstituteofarchitects.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-green-200 bg-white px-5 sm:px-6 py-3 text-sm font-semibold
                    text-[#2e7d32] hover:border-[#1a4a1a] hover:text-[#1a4a1a] active:scale-95 transition-all text-center"
                >
                  Visit IIA Website
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Venue Section ──────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
        <SectionTitle
          label="The Venue"
          sub="Saffron Hall, Vardaan Grand — Sector-21C, GymKhana Club, Surajkund Road, Faridabad"
        />
        <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { src: '/saffron hall .webp', label: 'Saffron Hall', sub: 'Vardaan Grand, Faridabad' },
            { src: '/venue stage.webp',   label: 'Main Stage',   sub: 'Grand auditorium stage' },
            { src: '/dinner space.webp',  label: 'Dinner Space', sub: 'Gala networking & dining' },
          ].map((v) => (
            <div key={v.label} className="relative rounded-2xl overflow-hidden h-52 sm:h-64 shadow-md group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={v.src}
                alt={v.label}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a4a1a]/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                <p className="text-white font-extrabold text-sm">{v.label}</p>
                <p className="text-green-300 text-xs mt-0.5">{v.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Registration / Pricing CTA ─────────────────────────────────────── */}
      <section className="relative bg-[#1a4a1a] overflow-hidden">
        <BlueprintGridOverlay />
        <CornerMark pos="tl" color="gold" />
        <CornerMark pos="tr" color="gold" />
        <CornerMark pos="bl" color="gold" />
        <CornerMark pos="br" color="gold" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
          <div className="text-center mb-8 sm:mb-10">
            <p className="text-[11px] font-bold text-[#c8a96e] uppercase tracking-[0.3em]">Limited Seats</p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white leading-snug">
              Secure Your Spot at Prakriti 2026
            </h2>
            <p className="mt-2 text-green-300 text-xs sm:text-sm">
              Saturday, 20 June 2026 &nbsp;·&nbsp; 3:00 PM &nbsp;·&nbsp; Saffron Hall, Vardaan Grand, Faridabad
            </p>
          </div>

          {/* Pricing grid — 1 col mobile, 2 col sm, 4 col lg */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
            {PRICING.map((p) => (
              <div
                key={p.type}
                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur px-4 sm:px-5 py-5
                  text-center hover:bg-white/10 hover:border-[#c8a96e]/40 transition-all"
              >
                <p className="text-[10px] sm:text-xs font-bold text-green-300 uppercase tracking-widest leading-snug">
                  {p.type}
                </p>
                <p className="mt-2 text-2xl sm:text-3xl font-black text-[#c8a96e]">{p.price}</p>
                <p className="mt-1 text-[10px] text-green-500 leading-tight">{p.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2.5 bg-[#c8a96e] hover:bg-[#b8995e]
                active:scale-95 text-[#1a4a1a] font-extrabold text-sm sm:text-base
                px-8 sm:px-10 py-3.5 sm:py-4 rounded-xl transition-all shadow-xl shadow-black/20"
            >
              Register Now
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <p className="mt-3 text-xs text-green-500">Pay via UPI · Confirmation email sent instantly</p>
          </div>
        </div>
      </section>

      {/* ─── Sponsors ───────────────────────────────────────────────────────── */}
      <section className="bg-white border-t border-green-100 py-10 sm:py-14 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <p className="text-base sm:text-lg font-extrabold uppercase tracking-[0.3em] text-[#1a4a1a]">Our Proud Sponsors</p>
            <div className="mt-2 h-0.5 w-14 bg-[#c8a96e] mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
            {SPONSORS.map((s) => (
              <div
                key={s.name}
                title={s.name}
                className="rounded-xl sm:rounded-2xl border border-green-100 bg-[#fafdf8] p-2 flex items-center
                  justify-center aspect-square hover:border-[#2e7d32] hover:shadow-md hover:-translate-y-0.5
                  transition-all duration-200 overflow-hidden group"
              >
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
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, #c8a96e 0, #c8a96e 1px, transparent 0, transparent 50%)',
            backgroundSize: '18px 18px',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">

            {/* Logo */}
            <div className="flex items-center justify-center sm:justify-start">
              <IIAEmblem size={320} variant="light" />
            </div>

            {/* Contact info */}
            <div className="text-center sm:text-right space-y-1">
              <p className="text-[#c8a96e] text-sm font-semibold">iafaridabadcentre@gmail.com</p>
              <p className="text-green-400 text-xs">www.indianinstituteofarchitects.com</p>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-[#2e7d32]/40 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
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
        <div className="h-5 w-1 rounded-full bg-[#c8a96e] shrink-0" />
        <h2 className="text-lg sm:text-xl font-extrabold text-[#1a4a1a] tracking-tight">{label}</h2>
      </div>
      {sub && <p className="mt-1 text-xs sm:text-sm text-gray-400 ml-4 leading-snug">{sub}</p>}
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
