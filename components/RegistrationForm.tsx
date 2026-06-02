'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { BookingResult } from '@/lib/types';

// ── Registration types ────────────────────────────────────────────────────────
const REGISTRATION_TYPES = [
  { label: 'IIA Member', price: 1 },
  { label: 'Non IIA Member', price: 1000 },
  { label: 'Visitor', price: 2000 },
  { label: 'Exhibitor', price: 3000 },
] as const;

type RegType = (typeof REGISTRATION_TYPES)[number]['label'];

// ── UPI app deep-link definitions ─────────────────────────────────────────────
const UPI_APPS = [
  { name: 'GPay',        logo: '/gpay.svg',       prefix: 'tez://upi/pay',   bg: '#ffffff' },
  { name: 'PhonePe',     logo: '/phonepe.svg',    prefix: 'phonepe://pay',   bg: '#5f259f' },
  { name: 'Paytm',       logo: '/paytm.svg',      prefix: 'paytmmp://pay',   bg: '#ffffff' },
  { name: 'BHIM',        logo: '/bhim.svg',        prefix: 'upi://pay',       bg: '#ff6b00' },
  { name: 'Amazon Pay',  logo: '/amazonpay.svg',  prefix: 'upi://pay',       bg: '#ffffff' },
] as const;

// ── Env ───────────────────────────────────────────────────────────────────────
const EVENT_SUBTITLE = process.env.NEXT_PUBLIC_EVENT_SUBTITLE ?? 'Architects for a Sustainable Tomorrow';
const EVENT_DATE = process.env.NEXT_PUBLIC_EVENT_DATE ?? 'Saturday, 20 June 2026 · 3:00 PM';
const EVENT_VENUE = process.env.NEXT_PUBLIC_EVENT_VENUE ?? 'Saffron Hall, Gymkhana Club, Faridabad';
const UPI_ID = process.env.NEXT_PUBLIC_UPI_ID ?? '9310530220@ybl';
const UPI_NAME = process.env.NEXT_PUBLIC_UPI_NAME ?? 'IIA Faridabad Centre';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Step1 {
  name: string; gender: string; nationality: string; firm: string;
  designation: string; email: string; phone: string; whatsapp: string;
  address: string; district: string; state: string; pincode: string;
}
type Step1Errors = Partial<Record<keyof Step1, string>>;

interface Step2 {
  registrationType: RegType;
  coaNumber: string;
  iiaMembershipNumber: string;
}

export default function RegistrationForm({ onSuccess }: { onSuccess: (b: BookingResult) => void }) {
  const [step, setStep] = useState<1 | 2>(1);

  const [s1, setS1] = useState<Step1>({
    name: '', gender: '', nationality: '', firm: '', designation: '',
    email: '', phone: '', whatsapp: '', address: '', district: '', state: '', pincode: '',
  });
  const [s1Errors, setS1Errors] = useState<Step1Errors>({});

  const [s2, setS2] = useState<Step2>({
    registrationType: 'IIA Member', coaNumber: '', iiaMembershipNumber: '',
  });

  // Payment state
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const selectedType = REGISTRATION_TYPES.find((t) => t.label === s2.registrationType)!;
  const amount = selectedType.price;

  // Build a UPI deep link for a given scheme prefix.
  // UPI ID must keep its literal @ — encoding it as %40 breaks most UPI apps.
  function buildUpiLink(schemePrefix: string) {
    const pn = encodeURIComponent(UPI_NAME);
    const tn = encodeURIComponent(`Prakriti2026 ${s2.registrationType}`);
    return `${schemePrefix}?pa=${UPI_ID}&pn=${pn}&am=${amount}&cu=INR&tn=${tn}`;
  }

  // ── Step 1 ──────────────────────────────────────────────────────────────────
  function handleS1Change(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setS1((p) => ({ ...p, [name]: value }));
    setS1Errors((p) => ({ ...p, [name]: undefined }));
  }

  function validateStep1(): boolean {
    const e: Step1Errors = {};
    if (!s1.name.trim()) e.name = 'Name is required.';
    if (!s1.gender) e.gender = 'Please select your gender.';
    if (!s1.nationality.trim()) e.nationality = 'Nationality is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s1.email)) e.email = 'Enter a valid email address.';
    if (!/^[6-9]\d{9}$/.test(s1.phone)) e.phone = 'Enter a valid 10-digit mobile number.';
    if (s1.whatsapp && !/^[6-9]\d{9}$/.test(s1.whatsapp)) e.whatsapp = 'Enter a valid WhatsApp number.';
    if (!s1.district.trim()) e.district = 'District is required.';
    if (!s1.state.trim()) e.state = 'State is required.';
    if (!/^\d{6}$/.test(s1.pincode)) e.pincode = 'Enter a valid 6-digit pincode.';
    setS1Errors(e);
    return Object.keys(e).length === 0;
  }

  function handleProceed(e: React.SyntheticEvent) {
    e.preventDefault();
    if (validateStep1()) { setStep(2); setPaymentInitiated(true); setPaymentConfirmed(false); }
  }

  // ── Step 2 ──────────────────────────────────────────────────────────────────
  function copyUpiId() {
    navigator.clipboard.writeText(UPI_ID).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }


  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!paymentConfirmed) {
      setApiError('Please confirm that you have completed the payment.');
      return;
    }
    if (s2.registrationType === 'IIA Member' && !s2.iiaMembershipNumber.trim()) {
      setApiError('IIA Membership Number is required for IIA Members.');
      return;
    }
    setSubmitting(true);
    setApiError('');

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...s1, ...s2, totalAmount: amount,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Registration failed.');
      onSuccess({ bookingId: data.bookingId, paymentId: UPI_ID, name: s1.name, email: s1.email, registrationType: s2.registrationType, amount });
    } catch (err) {
      setApiError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full rounded-2xl shadow-xl overflow-hidden border border-green-100">
      {/* Header */}
      <div className="relative bg-[#1a4a1a] px-7 py-5 text-white overflow-hidden">
        {/* Blueprint grid in header */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.08]" aria-hidden>
          <defs>
            <pattern id="hg" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#c8a96e" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hg)"/>
        </svg>
        {/* Corner marks */}
        <svg className="absolute top-2 left-2 opacity-40" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M 8,0 L 0,0 L 0,8" stroke="#c8a96e" strokeWidth="1.5" fill="none"/>
        </svg>
        <svg className="absolute top-2 right-2 opacity-40" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M 8,0 L 16,0 L 16,8" stroke="#c8a96e" strokeWidth="1.5" fill="none"/>
        </svg>
        {/* Drafting compass small icon */}
        <svg className="absolute bottom-4 right-5 opacity-10" width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden>
          <circle cx="24" cy="24" r="22" stroke="#c8a96e" strokeWidth="1"/>
          <circle cx="24" cy="24" r="14" stroke="#c8a96e" strokeWidth="0.7"/>
          <line x1="24" y1="2"  x2="24" y2="46" stroke="#c8a96e" strokeWidth="0.8"/>
          <line x1="2"  y1="24" x2="46" y2="24" stroke="#c8a96e" strokeWidth="0.8"/>
          <polygon points="24,2 22,10 24,8 26,10" fill="#c8a96e"/>
        </svg>
        {/* Content */}
        <div className="relative flex items-center justify-between">
          <p className="text-[11px] font-extrabold tracking-[0.2em] uppercase text-[#c8a96e]">
            {step === 1 ? 'Step 1 of 2 — Attendee Details' : 'Step 2 of 2 — Registration & Payment'}
          </p>
          <span className="text-[11px] font-bold text-green-400 font-mono">{step}/2</span>
        </div>
        <h1 className="relative mt-2 text-xl font-extrabold text-white">Prakriti 2026 — Event Registration</h1>
        <p className="relative mt-0.5 text-xs text-[#c8a96e]/70 tracking-widest">Design · Conserve · Restore</p>
        <div className="relative mt-3.5 flex gap-1.5">
          <div className="h-1 flex-1 rounded-full bg-[#c8a96e]" />
          <div className={`h-1 flex-1 rounded-full transition-colors duration-300 ${step === 2 ? 'bg-[#c8a96e]' : 'bg-white/10'}`} />
        </div>
      </div>

      <div className="bg-white px-7 py-7">
        {/* ── STEP 1 ── */}
        {step === 1 && (
          <form onSubmit={handleProceed} noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <Field label="Full Name" id="name" name="name" value={s1.name}
                  onChange={handleS1Change} placeholder="e.g. Rahul Vashisth" error={s1Errors.name} required />
              </div>

              <div>
                <label className="label">Gender <Req /></label>
                <div className="flex gap-5 mt-1">
                  {['Male', 'Female', 'Other'].map((g) => (
                    <label key={g} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                      <input type="radio" name="gender" value={g}
                        checked={s1.gender === g} onChange={handleS1Change}
                        className="accent-[#2e7d32]" />
                      {g}
                    </label>
                  ))}
                </div>
                {s1Errors.gender && <p className="err">{s1Errors.gender}</p>}
              </div>

              <Field label="Nationality" id="nationality" name="nationality" value={s1.nationality}
                onChange={handleS1Change} placeholder="Indian" error={s1Errors.nationality} required />

              <Field label="Firm / Company Name" id="firm" name="firm" value={s1.firm}
                onChange={handleS1Change} placeholder="Firm Name & Associates" />

              <Field label="Designation" id="designation" name="designation" value={s1.designation}
                onChange={handleS1Change} placeholder="Principal Architect" />

              <div className="sm:col-span-2">
                <Field label="Email Address" id="email" name="email" type="email" value={s1.email}
                  onChange={handleS1Change} placeholder="you@example.com" error={s1Errors.email} required />
              </div>

              <div>
                <label className="label" htmlFor="phone">Phone Number <Req /></label>
                <PhoneInput id="phone" name="phone" value={s1.phone} onChange={handleS1Change} error={s1Errors.phone} />
              </div>

              <div>
                <label className="label" htmlFor="whatsapp">WhatsApp Number</label>
                <PhoneInput id="whatsapp" name="whatsapp" value={s1.whatsapp} onChange={handleS1Change} error={s1Errors.whatsapp} />
              </div>

              <div className="sm:col-span-2">
                <label className="label" htmlFor="address">Full Address</label>
                <textarea id="address" name="address" value={s1.address} onChange={handleS1Change}
                  placeholder="House No., Street, Locality" rows={2} className="input resize-none" />
              </div>

              <Field label="District" id="district" name="district" value={s1.district}
                onChange={handleS1Change} placeholder="Faridabad" error={s1Errors.district} required />

              <Field label="State" id="state" name="state" value={s1.state}
                onChange={handleS1Change} placeholder="Haryana" error={s1Errors.state} required />

              <div className="sm:col-span-2 sm:w-1/2">
                <Field label="Pincode" id="pincode" name="pincode" value={s1.pincode}
                  onChange={handleS1Change} placeholder="121001" maxLength={6} error={s1Errors.pincode} required />
              </div>
            </div>

            <button type="submit"
              className="mt-7 w-full rounded-xl bg-[#2e7d32] py-4 text-base font-bold text-white hover:bg-[#1a4a1a] transition">
              Proceed to Payment →
            </button>
          </form>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <form onSubmit={handleSubmit} noValidate className="space-y-6">

            {/* Registration type */}
            <div>
              <label className="label">Registration Type <Req /></label>
              <div className="grid grid-cols-2 gap-3 mt-1">
                {REGISTRATION_TYPES.map((t) => (
                  <label key={t.label}
                    className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 cursor-pointer transition ${s2.registrationType === t.label ? 'border-[#2e7d32] bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex items-center gap-2">
                      <input type="radio" name="registrationType" value={t.label}
                        checked={s2.registrationType === t.label}
                        onChange={(e) => { setS2((p) => ({ ...p, registrationType: e.target.value as RegType })); setPaymentInitiated(false); setPaymentConfirmed(false); }}
                        className="accent-[#2e7d32]" />
                      <span className="text-sm font-medium text-gray-800">{t.label}</span>
                    </div>
                    <span className="text-sm font-bold text-[#2e7d32]">₹{t.price.toLocaleString('en-IN')}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* COA + IIA numbers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="COA Number" id="coaNumber" name="coaNumber"
                value={s2.coaNumber}
                onChange={(e) => setS2((p) => ({ ...p, coaNumber: e.target.value }))}
                placeholder="CA/XXXX/XXXX" />
              <Field
                label={`IIA Membership No.${s2.registrationType === 'IIA Member' ? '' : ' (if applicable)'}`}
                id="iiaMembershipNumber" name="iiaMembershipNumber"
                value={s2.iiaMembershipNumber}
                onChange={(e) => setS2((p) => ({ ...p, iiaMembershipNumber: e.target.value }))}
                placeholder="IIA/XXXX/XXXX"
                required={s2.registrationType === 'IIA Member'} />
            </div>

            {/* ── UPI Payment block ── */}
            <div className="rounded-2xl border-2 border-green-200 overflow-hidden">

              {/* Amount header */}
              <div className="bg-[#1a4a1a] px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-400 uppercase tracking-wider">Amount to Pay</p>
                  <p className="text-3xl font-extrabold text-white">₹{amount.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-green-400 mt-0.5">{s2.registrationType}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{s1.name}</p>
                  <p className="text-xs text-green-400">{s1.email}</p>
                </div>
              </div>

              {/* QR + UPI ID side by side */}
              <div className="bg-white px-5 py-5 flex flex-col sm:flex-row gap-5 items-center border-b border-green-100">

                {/* QR Code */}
                <div className="shrink-0 flex flex-col items-center gap-2">
                  <div className="rounded-xl border-2 border-green-200 p-3 bg-white shadow-sm">
                    <QRCodeSVG
                      value={`upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Prakriti2026 ${s2.registrationType}`)}`}
                      size={148}
                      fgColor="#1a4a1a"
                      bgColor="#ffffff"
                      level="M"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 text-center font-medium">Scan with any UPI app</p>
                </div>

                {/* UPI ID + instructions */}
                <div className="flex-1 min-w-0 w-full">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Pay to UPI ID</p>
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-3">
                    <p className="flex-1 text-base font-bold text-gray-900 font-mono truncate">{UPI_ID}</p>
                    <button type="button" onClick={copyUpiId}
                      className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-bold transition
                        ${copied ? 'border-green-400 bg-green-100 text-green-700' : 'border-gray-300 bg-white text-gray-600 hover:border-[#2e7d32] hover:text-[#2e7d32]'}`}>
                      {copied ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    <strong className="text-[#1a4a1a]">How to pay:</strong> Open GPay / PhonePe / Paytm → Scan QR code or enter UPI ID manually → Pay <strong>₹{amount.toLocaleString('en-IN')}</strong>
                  </p>
                </div>
              </div>

              {/* App deep-links (secondary, with disclaimer) */}
              <div className="bg-gray-50 px-5 py-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
                  Or try opening directly in app
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {UPI_APPS.map((app) => (
                    <a key={app.name}
                      href={buildUpiLink(app.prefix)}
                      onClick={() => setPaymentInitiated(true)}
                      title={app.name}
                      style={{ backgroundColor: app.bg }}
                      className="rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all flex items-center justify-center p-2 aspect-[5/3]">
                      <img src={app.logo} alt={app.name} className="w-full h-full object-contain" />
                    </a>
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-amber-600 text-center">
                  ⚠ Some apps (e.g. GPay) may decline web-initiated payments — use the QR code above if this happens
                </p>
              </div>
            </div>

            {/* Payment confirmation checkbox */}
            <label className={`flex items-start gap-3 rounded-xl border-2 px-4 py-4 cursor-pointer transition ${paymentConfirmed ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input type="checkbox" checked={paymentConfirmed}
                onChange={(e) => { setPaymentConfirmed(e.target.checked); setApiError(''); }}
                className="mt-0.5 h-4 w-4 accent-[#2e7d32] shrink-0" />
              <span className="text-sm text-gray-700 leading-relaxed">
                I confirm that I have completed the payment of{' '}
                <strong className="text-[#1a4a1a]">₹{amount.toLocaleString('en-IN')}</strong>{' '}
                to UPI ID <strong className="font-mono text-[#1a4a1a]">{UPI_ID}</strong>{' '}
                ({UPI_NAME}).
              </span>
            </label>


            {apiError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {apiError}
              </div>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)}
                className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                ← Back
              </button>
              <button type="submit" disabled={submitting}
                className="flex-[2] rounded-xl bg-[#2e7d32] py-3 text-base font-bold text-white hover:bg-[#1a4a1a] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition">
                {submitting ? <><Spinner /> Submitting…</> : 'Submit Registration'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Small shared components ───────────────────────────────────────────────────
function Req() { return <span className="text-red-500 ml-0.5">*</span>; }

function Field({
  label, id, name, type = 'text', value, onChange, placeholder,
  error, required, maxLength,
}: {
  label: string; id: string; name: string; type?: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string; error?: string; required?: boolean; maxLength?: number;
}) {
  return (
    <div>
      <label className="label" htmlFor={id}>{label} {required && <Req />}</label>
      <input id={id} name={name} type={type} value={value} onChange={onChange}
        placeholder={placeholder} maxLength={maxLength}
        className={`input ${error ? 'border-red-500' : ''}`} />
      {error && <p className="err">{error}</p>}
    </div>
  );
}

function PhoneInput({ id, name, value, onChange, error }: {
  id: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; error?: string;
}) {
  return (
    <>
      <div className="flex">
        <span className="inline-flex items-center rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500">+91</span>
        <input id={id} name={name} type="tel" maxLength={10} value={value} onChange={onChange}
          placeholder="9876543210" className={`input rounded-l-none ${error ? 'border-red-500' : ''}`} />
      </div>
      {error && <p className="err">{error}</p>}
    </>
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
