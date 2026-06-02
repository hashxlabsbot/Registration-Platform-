'use client';

import { BookingResult } from '@/lib/types';

const EVENT_NAME    = process.env.NEXT_PUBLIC_EVENT_NAME     ?? 'Prakriti 2026';
const EVENT_DATE    = process.env.NEXT_PUBLIC_EVENT_DATE     ?? 'Saturday, 20 June 2026 · 3:00 PM';
const EVENT_VENUE   = process.env.NEXT_PUBLIC_EVENT_VENUE    ?? 'Saffron Hall, Faridabad';

export default function SuccessScreen({ booking }: { booking: BookingResult }) {
  return (
    <div className="w-full max-w-lg">
      {/* Check circle */}
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#2e7d32] shadow-lg shadow-green-700/30 ring-4 ring-white">
        <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div className="rounded-2xl border border-green-100 bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#1a4a1a] px-7 py-5 text-center">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#c8a96e]">Registration Received</p>
          <h2 className="mt-1 text-xl font-extrabold text-white">{EVENT_NAME}</h2>
          <p className="text-xs text-[#c8a96e]/70 tracking-widest mt-0.5">Design · Conserve · Restore</p>
        </div>

        {/* Body */}
        <div className="px-7 py-6">
          <p className="text-sm text-gray-600 leading-relaxed text-center">
            Thank you, <strong className="text-[#1a4a1a]">{booking.name}</strong>! Your registration has been received.
            A confirmation email has been sent to{' '}
            <strong className="text-[#1a4a1a]">{booking.email}</strong>.
          </p>

          {/* Booking summary */}
          <div className="mt-5 rounded-xl bg-[#f9fdf8] border border-green-100 px-5 py-4 space-y-3">
            <Row label="Booking ID"         value={booking.bookingId} mono />
            <Row label="Attendee"           value={booking.name} />
            <Row label="Registration Type"  value={booking.registrationType} />
            <Row label="Amount Paid"        value={`₹${booking.amount.toLocaleString('en-IN')}`} />
            <div className="pt-2 mt-2 border-t border-green-100 space-y-3">
              <Row label="Event"            value={EVENT_NAME} />
              <Row label="Date & Time"      value={EVENT_DATE} />
              <Row label="Venue"            value={EVENT_VENUE} />
            </div>
          </div>

          {/* What's next */}
          <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-5 py-4">
            <p className="text-xs font-bold text-amber-800 mb-1">What happens next?</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              The organising team will verify your payment. Your entry ticket with a QR code
              for venue check-in will be emailed to you once confirmed.
            </p>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="mt-5 w-full rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition">
            Register another attendee
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-gray-400 shrink-0">{label}</span>
      <span className={`text-xs text-gray-900 font-semibold text-right ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}
