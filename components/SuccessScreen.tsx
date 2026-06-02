'use client';

import { BookingResult } from '@/app/page';

const EVENT_NAME = process.env.NEXT_PUBLIC_EVENT_NAME ?? 'Prakriti 2026';
const EVENT_SUBTITLE = process.env.NEXT_PUBLIC_EVENT_SUBTITLE ?? 'Architects for a Sustainable Tomorrow';
const EVENT_DATE = process.env.NEXT_PUBLIC_EVENT_DATE ?? 'Saturday, 20 June 2026 · 3:00 PM';
const EVENT_VENUE = process.env.NEXT_PUBLIC_EVENT_VENUE ?? 'Saffron Hall, Gymkhana Club, Faridabad';

export default function SuccessScreen({ booking }: { booking: BookingResult }) {
  return (
    <div className="w-full max-w-lg text-center">
      {/* Checkmark */}
      <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#2e7d32] shadow-lg shadow-green-700/40">
        <svg className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div className="rounded-2xl bg-white px-8 py-8 shadow-2xl">
        <p className="text-xs font-bold tracking-widest uppercase text-[#2e7d32]">Registration Received</p>
        <h2 className="mt-1 text-2xl font-extrabold text-gray-900">{EVENT_NAME}</h2>
        <p className="text-sm text-gray-500">{EVENT_SUBTITLE}</p>

        <p className="mt-4 text-sm text-gray-600 leading-relaxed">
          Thank you, <strong className="text-gray-900">{booking.name}</strong>! Your registration has been received.{' '}
          A confirmation email has been sent to <strong className="text-gray-900">{booking.email}</strong>.
          Your entry ticket will be sent after payment verification.
        </p>

        {/* Summary */}
        <div className="mt-5 space-y-2.5 rounded-xl bg-gray-50 px-5 py-4 text-left text-sm">
          <Row label="Booking ID" value={booking.bookingId} mono />
          <Row label="Attendee" value={booking.name} />
          <Row label="Registration Type" value={booking.registrationType} />
          <Row label="Amount Paid" value={`₹${booking.amount.toLocaleString('en-IN')}`} />
          <Row label="Event" value={EVENT_NAME} />
          <Row label="Date & Time" value={EVENT_DATE} />
          <Row label="Venue" value={EVENT_VENUE} />
        </div>

        <div className="mt-5 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800 text-left">
          <strong>What happens next?</strong> The organizing team will verify your payment screenshot.
          Your entry ticket (with QR code for venue check-in) will be emailed to you once confirmed.
        </div>

        <button
          onClick={() => window.location.reload()}
          className="mt-5 w-full rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
        >
          Register another attendee
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className={`text-gray-900 font-semibold text-right ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}
