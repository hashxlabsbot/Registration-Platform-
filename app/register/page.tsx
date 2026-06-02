'use client';

import { useState } from 'react';
import Link from 'next/link';
import RegistrationForm from '@/components/RegistrationForm';
import SuccessScreen from '@/components/SuccessScreen';
import { BookingResult } from '@/lib/types';
import { IIAEmblem, BlueprintGridOverlay } from '@/components/arch-elements';

export default function RegisterPage() {
  const [booking, setBooking] = useState<BookingResult | null>(null);

  return (
    <div className="min-h-screen" style={{
      backgroundColor: '#f5f7f2',
      backgroundImage: 'radial-gradient(circle, rgba(46,125,50,0.10) 1.2px, transparent 1.2px)',
      backgroundSize: '28px 28px',
    }}>

      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-green-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-5 py-3 flex items-center justify-between">
          <Link href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#2e7d32]
              hover:text-[#1a4a1a] transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Event
          </Link>
          <div className="flex items-center gap-2.5">
            <IIAEmblem size={28} />
            <div className="leading-tight hidden sm:block">
              <p className="text-xs font-extrabold text-[#1a4a1a]">Prakriti 2026</p>
              <p className="text-[10px] text-gray-400">20 June 2026 · Faridabad</p>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Event summary strip ────────────────────────────────────────────── */}
      {!booking && (
        <div className="relative bg-[#1a4a1a] overflow-hidden">
          <BlueprintGridOverlay />
          <div className="relative max-w-3xl mx-auto px-5 py-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold text-[#c8a96e] uppercase tracking-[0.25em]">
                Event Registration
              </p>
              <h1 className="text-lg font-extrabold text-white mt-0.5">
                Prakriti 2026 — Architects for a Sustainable Tomorrow
              </h1>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-green-300">
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-[#c8a96e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Sat, 20 June 2026
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-[#c8a96e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                3:00 PM Onwards
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-[#c8a96e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                Saffron Hall, Faridabad
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Content ─────────────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        {booking ? (
          <div className="space-y-5">
            <SuccessScreen booking={booking} />
            <div className="text-center">
              <Link href="/"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2e7d32]
                  hover:text-[#1a4a1a] transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back to Event Page
              </Link>
            </div>
          </div>
        ) : (
          <RegistrationForm onSuccess={setBooking} />
        )}
      </div>

      {/* ─── Minimal footer ──────────────────────────────────────────────────── */}
      <footer className="bg-[#1a4a1a] py-4 px-6 mt-8">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <p className="text-green-400 text-xs">© 2026 IIA Faridabad Centre</p>
          <Link href="/" className="text-[#c8a96e] text-xs font-semibold hover:text-white transition-colors">
            ← Back to Event
          </Link>
        </div>
      </footer>

    </div>
  );
}
