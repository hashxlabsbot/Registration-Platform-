'use client';

import { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { BookingResult } from '@/lib/types';

function nameSize(name: string): string {
  const l = name.length;
  if (l <= 14) return '17px';
  if (l <= 18) return '14px';
  if (l <= 24) return '12px';
  return '10px';
}

export default function SuccessScreen({ booking }: { booking: BookingResult }) {
  const [downloading, setDownloading] = useState(false);

  const qrValue = JSON.stringify({
    id:   booking.bookingId,
    name: booking.name,
    type: booking.registrationType,
    amt:  `Rs.${booking.amount}`,
    ph:   booking.phone,
    em:   booking.email,
    ev:   'PRAKRITI2026',
    dt:   '20-06-2026',
  });

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch('/api/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId:        booking.bookingId,
          name:             booking.name,
          email:            booking.email,
          phone:            booking.phone,
          organization:     booking.organization,
          designation:      booking.designation,
          registrationType: booking.registrationType,
          totalAmount:      booking.amount,
          utrNumber:        booking.utrNumber,
        }),
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `prakriti2026-ticket-${booking.bookingId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[download]', err);
      alert('Could not download ticket. Please check your email for the PDF copy.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto space-y-6">

      {/* Success banner */}
      <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-4">
        <div className="shrink-0 h-9 w-9 flex items-center justify-center rounded-full bg-[#2e7d32]">
          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-[#1a4a1a]">Registration Successful!</p>
          <p className="text-xs text-gray-500">Your entry ticket is ready. Download and carry it to the venue.</p>
        </div>
      </div>

      {/* Email confirmation notice */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4">
        <div className="shrink-0 h-9 w-9 flex items-center justify-center rounded-full bg-blue-100">
          <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-blue-800">Ticket sent to your email</p>
          <p className="text-xs text-blue-600 break-all mt-0.5">
            A copy of your ticket has been sent to{' '}
            <span className="font-semibold">{booking.email}</span>
          </p>
          <p className="text-xs text-blue-400 mt-1">Check your spam/junk folder if you don&apos;t see it.</p>
        </div>
      </div>

      {/* ── THE TICKET ── */}
      <div
        id="ticket-card"
        className="w-full max-w-[320px] mx-auto rounded-2xl overflow-hidden shadow-2xl relative border border-green-200"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/Id-background.png" alt="Prakriti 2026 Ticket" className="w-full block" />
        <div className="absolute inset-0 flex items-start justify-center pt-[38%] pb-[25%]">
          <div className="rounded-[14px] flex flex-col items-center justify-center aspect-square w-[62%] gap-1.5 p-2 bg-transparent">

            {/* Name — font scales with length so it never truncates */}
            <div
              className="font-serif font-bold text-[#1a3d21] text-center leading-tight w-full break-words"
              style={{ fontSize: nameSize(booking.name), textShadow: '0 1px 8px rgba(255,255,255,0.8)' }}
            >
              {booking.name.toUpperCase()}
            </div>

            <div className="w-[82%] h-[1.5px] bg-[#a5d6a7]/70 shrink-0" />

            <div
              className="text-[#1a5c2a] font-semibold text-center leading-snug text-[11px]"
              style={{ textShadow: '0 1px 6px rgba(255,255,255,0.8)' }}
            >
              {booking.designation && booking.designation !== '—' ? booking.designation : booking.organization}
            </div>

            <div className="flex gap-1.5 flex-wrap justify-center mt-1">
              <div className="bg-[#e8f5e9]/85 text-[#1b5e20] border border-[#a5d6a7] rounded px-2 py-0.5 font-bold text-[9px]">
                {booking.bookingId}
              </div>
            </div>

            <div className="flex flex-col items-center gap-1 mt-1">
              <div className="p-0.5 border-[1.5px] border-[#a5d6a7]/80 rounded bg-white">
                <QRCodeCanvas
                  value={qrValue}
                  size={76}
                  fgColor="#1a4a1a"
                  bgColor="#ffffff"
                  level="M"
                  style={{ display: 'block' }}
                />
              </div>
              <div
                className="font-semibold text-[#2d5a35] text-[9px]"
                style={{ textShadow: '0 1px 3px rgba(255,255,255,0.6)' }}
              >
                Scan at Venue Entrance
              </div>
              <div className="bg-[#1a5c2a] text-white rounded-full px-3 py-1.5 mt-2 font-bold text-[11px] shadow-md tracking-normal leading-none whitespace-nowrap w-fit max-w-full">
                {(booking.registrationType === 'Non-Architect' || booking.registrationType === 'Non - Architect') ? 'DELEGATE' : booking.registrationType.toUpperCase()}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Download button */}
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="w-full flex items-center justify-center gap-2.5 bg-[#1a4a1a] hover:bg-[#2e7d32]
          disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm
          px-6 py-4 rounded-xl transition-colors shadow-md shadow-[#1a4a1a]/20"
      >
        {downloading ? (
          <>
            <Spinner />
            Downloading…
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v13m0 0l-4-4m4 4l4-4M3 21h18" />
            </svg>
            Download Ticket
          </>
        )}
      </button>

      <button
        onClick={() => window.location.reload()}
        className="w-full rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition"
      >
        Register another attendee
      </button>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
