'use client';

import { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { BookingResult } from '@/lib/types';

// Scale factor: HTML card 320px wide / PDF canvas 504pt wide ≈ 0.635
function nameSize(name: string): string {
  const l = name.length;
  if (l <= 14) return '19px';
  if (l <= 20) return '16px';
  if (l <= 28) return '14px';
  return '11px';
}

function isArchitect(regType: string): boolean {
  return regType === 'Architect - IIA Member' || regType === 'Architect - Non-IIA Member';
}

function footerLabel(regType: string): string {
  if (isArchitect(regType)) return 'ARCHITECT';
  if (regType === 'Non-Architect' || regType === 'Non - Architect') return 'DELEGATE';
  return regType.toUpperCase();
}

export default function SuccessScreen({ booking }: { booking: BookingResult }) {
  const [downloading, setDownloading] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const emailSent = booking.emailSent !== false; // treat undefined as true (invite/legacy)

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
      // Delay revocation so the browser has time to start the download
      setTimeout(() => URL.revokeObjectURL(url), 1000);
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

      {/* Email confirmation notice — adapts based on whether email actually sent */}
      {emailSent ? (
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
      ) : (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <div className="shrink-0 h-9 w-9 flex items-center justify-center rounded-full bg-amber-100">
            <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-amber-800">Email could not be sent automatically</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Your registration is confirmed (Booking ID: <span className="font-semibold font-mono">{booking.bookingId}</span>).
              Please use the Download button below to save your ticket.
            </p>
          </div>
        </div>
      )}

      {/* ── THE TICKET ── */}
      <div
        id="ticket-card"
        className="w-full max-w-[320px] mx-auto overflow-hidden shadow-2xl relative border border-green-200"
        style={{ borderRadius: '18px', aspectRatio: '252/360' }}
      >
        {/* Loading skeleton — shown until image loads */}
        {!imgLoaded && (
          <div className="absolute inset-0 bg-[#1a4a1a]/10 animate-pulse flex items-center justify-center">
            <svg className="h-8 w-8 text-[#1a4a1a]/30 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          </div>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Id-background.png"
          alt="Prakriti 2026 Ticket"
          className="w-full block"
          loading="eager"
          onLoad={() => setImgLoaded(true)}
          style={{ opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
        />

        {/* Overlay — mirrors the PDF FALLBACK_LAYOUT (canvas 504×720pt → scale ×0.635 for 320px card) */}
        <div className="absolute inset-0" style={{ opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.3s ease' }}>

          {/* Full-width green date + venue bar — PDF: barY=343/H=720 = 47.6%, barH=34/720 = 4.7% */}
          <div
            className="absolute left-0 right-0 bg-[#1a5c2a] flex items-center justify-center gap-4 text-white font-bold tracking-widest"
            style={{ top: '47.6%', height: '4.7%', fontSize: '8px' }}
          >
            <span>
              20<sup style={{ fontSize: '5px', verticalAlign: 'super', lineHeight: 0 }}>TH</sup>
              {' '}JUNE, 2026
            </span>
            <span>FARIDABAD</span>
          </div>

          {/* Name — PDF: y=390/720=54.2%, Times-Bold, dark green */}
          <div
            className="absolute left-0 right-0 px-4 text-center font-serif font-bold text-[#1a3d21] leading-tight"
            style={{ top: '54.2%', fontSize: nameSize((isArchitect(booking.registrationType) ? 'AR. ' : '') + booking.name) }}
          >
            {(isArchitect(booking.registrationType) ? 'AR. ' : '') + booking.name.toUpperCase()}
          </div>

          {/* Divider — PDF: y=426/720=59.2% */}
          <div className="absolute left-[14%] right-[14%] h-[1px] bg-[#a5d6a7]/70" style={{ top: '59.2%' }} />

          {/* Designation — PDF: y=432/720=60%, Helvetica-Bold, uppercase */}
          {booking.designation && booking.designation !== '—' && (
            <div
              className="absolute left-0 right-0 px-4 text-center text-[#2d6a3f] font-semibold"
              style={{ top: '60%', fontSize: '9px' }}
            >
              {booking.designation.toUpperCase()}
            </div>
          )}

          {/* Firm — PDF: y=460/720=63.9%, Helvetica, uppercase */}
          {booking.organization && booking.organization !== '—' && (
            <div
              className="absolute left-0 right-0 px-4 text-center text-[#2d6a3f]"
              style={{ top: '63.9%', fontSize: '8px' }}
            >
              {booking.organization.toUpperCase()}
            </div>
          )}

          {/* QR Code — PDF: y=486/720=67.5%, size=140/504=27.8% of width → ~89px at 320px card */}
          <div className="absolute left-1/2 -translate-x-1/2" style={{ top: '67.5%' }}>
            <div className="p-0.5 border border-[#a5d6a7]/80 rounded bg-white">
              <QRCodeCanvas
                value={qrValue}
                size={89}
                fgColor="#1a4a1a"
                bgColor="#ffffff"
                level="M"
                style={{ display: 'block' }}
              />
            </div>
          </div>

          {/* Scan label — PDF: y≈631/720=87.6% */}
          <div
            className="absolute left-0 right-0 text-center font-bold text-[#2d5a35]"
            style={{ top: '87.6%', fontSize: '6px', letterSpacing: '0.08em' }}
          >
            SCAN AT VENUE ENTRANCE
          </div>

          {/* Footer bar — booking ID (small) + ARCHITECT/DELEGATE (large) */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-[#1a5c2a] text-white text-center"
            style={{ top: '90.6%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1px', paddingTop: '2px' }}
          >
            <span style={{ fontSize: '5.5px', color: '#a5d6a7', fontWeight: 400, letterSpacing: '0.08em', lineHeight: 1.2 }}>
              {booking.bookingId}
            </span>
            <span style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '0.15em', lineHeight: 1.1 }}>
              {footerLabel(booking.registrationType)}
            </span>
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
