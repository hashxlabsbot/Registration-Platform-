'use client';

import { useState } from 'react';
import Link from 'next/link';
import RegistrationForm from '@/components/RegistrationForm';
import SuccessScreen from '@/components/SuccessScreen';
import { BookingResult } from '@/lib/types';
import { IIAEmblem, BlueprintGridOverlay } from '@/components/arch-elements';
import CountdownTimer from '@/components/CountdownTimer';

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
                Saffron Hall, Vardaan Grand — Sector-21C, GymKhana Club, Surajkund Road, Faridabad
              </span>
            </div>
          </div>
          {/* Deadline row */}
          <div className="relative w-full border-t border-white/10 pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-[#c8a96e] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-[10px] font-bold text-[#c8a96e] uppercase tracking-widest">
                Registrations Closed on 15 June 2026
              </span>
            </div>
            <CountdownTimer variant="dark" />
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
          <div className="bg-white rounded-3xl border border-green-100 p-8 sm:p-12 text-center shadow-md space-y-6">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 border border-red-100">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-[#1a4a1a]">Registrations are Closed</h2>
              <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                Thank you for your overwhelming response! The registration period for Prakriti 2026 has officially ended on June 15, 2026.
              </p>
            </div>
            <div className="border-t border-green-50/80 pt-6">
              <p className="text-xs text-gray-400">
                If you have already registered and have queries regarding your tickets, please contact us at:
              </p>
              <div className="mt-3 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
                <a href="mailto:iiafaridabadcentre@gmail.com" className="text-[#2e7d32] font-semibold text-xs hover:underline">
                  iiafaridabadcentre@gmail.com
                </a>
                <span className="hidden sm:inline text-gray-300">|</span>
                <a href="tel:+918810235570" className="text-[#2e7d32] font-semibold text-xs hover:underline">
                  +91-8810235570 (Call/WhatsApp)
                </a>
              </div>
            </div>
          </div>
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
