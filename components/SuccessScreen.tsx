'use client';

import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { BookingResult } from '@/lib/types';

const EVENT_DATE  = process.env.NEXT_PUBLIC_EVENT_DATE  ?? 'Saturday, 20 June 2026 · 3:00 PM';
const EVENT_VENUE = process.env.NEXT_PUBLIC_EVENT_VENUE ?? 'Saffron Hall, Vardaan Group, Faridabad';

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
          bookingId: booking.bookingId,
          name: booking.name,
          email: booking.email,
          phone: booking.phone,
          organization: booking.organization,
          designation: booking.designation,
          registrationType: booking.registrationType,
          totalAmount: booking.amount,
          utrNumber: booking.utrNumber,
          eventDate: EVENT_DATE,
          eventVenue: EVENT_VENUE,
        }),
      });
      if (!res.ok) throw new Error('PDF generation failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prakriti2026-ticket-${booking.bookingId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Could not generate PDF. Please screenshot your ticket.');
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

      {/* ── THE TICKET ── */}
      <div className="w-full rounded-3xl overflow-hidden shadow-2xl border border-green-200" style={{ background: '#fff' }}>

        {/* Top band: dark green */}
        <div className="relative bg-[#1a4a1a] px-6 pt-6 pb-0 overflow-hidden">
          {/* Subtle dot pattern */}
          <div className="absolute inset-0 opacity-[0.07]" style={{
            backgroundImage: 'radial-gradient(circle, #c8a96e 1px, transparent 1px)',
            backgroundSize: '18px 18px',
          }} />

          {/* IIA header row */}
          <div className="relative flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full border-2 border-[#c8a96e] flex items-center justify-center shrink-0 bg-white/10 p-0.5">
                <img src="/IIA-Logo.svg" alt="IIA" className="w-full h-full object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
              </div>
              <div className="leading-tight">
                <p className="text-[9px] font-bold text-[#c8a96e] uppercase tracking-widest">The Indian Institute of Architects</p>
                <p className="text-[8px] text-green-500 uppercase tracking-wider">Faridabad Centre</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-[#c8a96e]/15 border border-[#c8a96e]/30 rounded-full px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c8a96e]" />
              <span className="text-[9px] font-bold text-[#c8a96e] uppercase tracking-wider">Entry Ticket</span>
            </div>
          </div>

          {/* Event title */}
          <div className="relative text-center pb-6">
            <h1 className="text-[52px] font-black text-white leading-none tracking-tight">Prakriti</h1>
            <p className="text-[40px] font-black text-[#c8a96e] leading-none tracking-[0.08em] -mt-1">2026</p>
            <p className="mt-2 text-green-300 text-[11px] font-medium tracking-wide">Architects for a Sustainable Tomorrow</p>
            <p className="text-[9px] text-[#c8a96e]/50 uppercase tracking-[0.35em] mt-0.5">Design · Conserve · Restore</p>
          </div>

          {/* Perforated edge — scallops at bottom of dark band */}
          <div className="relative -mx-0 h-4 flex">
            {Array.from({ length: 32 }).map((_, i) => (
              <div key={i} className="flex-1 flex justify-center">
                <div className="h-4 w-4 rounded-full bg-[#f4f7f0] -mb-2" />
              </div>
            ))}
          </div>
        </div>

        {/* Middle white section — QR code */}
        <div className="bg-[#f4f7f0] px-6 py-6 flex flex-col items-center gap-3">

          <p className="text-[9px] font-bold text-[#2e7d32]/60 uppercase tracking-[0.3em]">Scan at Venue Entrance</p>

          {/* QR code with frame */}
          <div className="relative p-3 bg-white rounded-2xl shadow-md border-2 border-[#2e7d32]/20">
            <QRCodeSVG
              value={qrValue}
              size={180}
              fgColor="#1a4a1a"
              bgColor="#ffffff"
              level="M"
              imageSettings={{
                src: '',
                height: 0,
                width: 0,
                excavate: false,
              }}
            />
            {/* Corner accents */}
            <svg className="absolute top-2 left-2" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M 6,0 L 0,0 L 0,6" stroke="#c8a96e" strokeWidth="1.5" fill="none"/>
            </svg>
            <svg className="absolute top-2 right-2" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M 6,0 L 12,0 L 12,6" stroke="#c8a96e" strokeWidth="1.5" fill="none"/>
            </svg>
            <svg className="absolute bottom-2 left-2" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M 0,6 L 0,12 L 6,12" stroke="#c8a96e" strokeWidth="1.5" fill="none"/>
            </svg>
            <svg className="absolute bottom-2 right-2" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M 12,6 L 12,12 L 6,12" stroke="#c8a96e" strokeWidth="1.5" fill="none"/>
            </svg>
          </div>

          {/* Booking ID pill */}
          <div className="flex items-center gap-2 bg-[#1a4a1a] rounded-xl px-5 py-2.5">
            <span className="text-[9px] font-bold text-green-400 uppercase tracking-widest">Booking ID</span>
            <span className="text-base font-black text-[#c8a96e] font-mono tracking-wider">{booking.bookingId}</span>
          </div>

          {/* Event info pills */}
          <div className="w-full grid grid-cols-2 gap-2 mt-1">
            <div className="bg-white rounded-xl px-3 py-2.5 border border-green-100 text-center">
              <p className="text-[8px] text-[#2e7d32]/50 uppercase tracking-widest font-bold">Date</p>
              <p className="text-[11px] font-bold text-[#1a4a1a] mt-0.5 leading-tight">20 June 2026</p>
              <p className="text-[9px] text-gray-400">Saturday · 3:00 PM</p>
            </div>
            <div className="bg-white rounded-xl px-3 py-2.5 border border-green-100 text-center">
              <p className="text-[8px] text-[#2e7d32]/50 uppercase tracking-widest font-bold">Venue</p>
              <p className="text-[11px] font-bold text-[#1a4a1a] mt-0.5 leading-tight">Saffron Hall</p>
              <p className="text-[9px] text-gray-400">Vardaan Group, Faridabad</p>
            </div>
          </div>
        </div>

        {/* Perforated divider */}
        <div className="relative bg-[#f4f7f0] flex items-center px-4 gap-1.5 py-1">
          <div className="h-4 w-4 rounded-full bg-white -ml-6 shrink-0" />
          <div className="flex-1 border-t-2 border-dashed border-[#2e7d32]/20" />
          <div className="h-4 w-4 rounded-full bg-white -mr-6 shrink-0" />
        </div>

        {/* Attendee details section */}
        <div className="bg-white px-6 py-5 space-y-0">
          <p className="text-[9px] font-extrabold text-[#2e7d32]/50 uppercase tracking-[0.3em] mb-4">Attendee Details</p>

          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <DetailCell label="Full Name" value={booking.name} span />
            <DetailCell label="Registration Type" value={booking.registrationType} highlight />
            <DetailCell label="Amount Paid" value={`₹${booking.amount.toLocaleString('en-IN')}`} highlight />
            <DetailCell label="Email" value={booking.email} span />
            <DetailCell label="Phone" value={`+91 ${booking.phone}`} />
            <DetailCell label="Organization" value={booking.organization} />
            {booking.designation && booking.designation !== '—' && (
              <DetailCell label="Designation" value={booking.designation} />
            )}
            <DetailCell label="UPI Ref / UTR" value={booking.utrNumber} mono />
          </div>
        </div>

        {/* Important notice */}
        <div className="bg-amber-50 border-t border-amber-100 px-6 py-3">
          <p className="text-[10px] text-amber-700 leading-relaxed">
            <strong>Carry a valid photo ID</strong> · Non-transferable · Entry subject to payment verification · Gates open at 2:30 PM
          </p>
        </div>

        {/* Footer */}
        <div className="bg-[#1a4a1a] px-6 py-3 flex items-center justify-between">
          <p className="text-[9px] text-green-600">Computer generated · No signature required</p>
          <p className="text-[9px] font-bold text-[#c8a96e] uppercase tracking-wider">Prakriti 2026</p>
        </div>
      </div>

      {/* Download button */}
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="w-full flex items-center justify-center gap-2.5 bg-[#1a4a1a] hover:bg-[#2e7d32]
          disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm
          px-6 py-4 rounded-xl transition-colors shadow-md shadow-[#1a4a1a]/20">
        {downloading ? (
          <>
            <Spinner />
            Generating PDF…
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v13m0 0l-4-4m4 4l4-4M3 21h18" />
            </svg>
            Download Ticket PDF
          </>
        )}
      </button>

      <button
        onClick={() => window.location.reload()}
        className="w-full rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition">
        Register another attendee
      </button>
    </div>
  );
}

function DetailCell({ label, value, span, highlight, mono }: {
  label: string; value: string; span?: boolean; highlight?: boolean; mono?: boolean;
}) {
  return (
    <div className={span ? 'col-span-2' : ''}>
      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className={`text-xs font-semibold leading-tight ${highlight ? 'text-[#2e7d32] font-bold' : 'text-[#1a4a1a]'} ${mono ? 'font-mono text-[11px]' : ''}`}>
        {value}
      </p>
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
