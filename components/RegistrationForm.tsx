'use client';

import { useState, useEffect } from 'react';
import { BookingResult } from '@/lib/types';

// ── Registration types ────────────────────────────────────────────────────────
const REGISTRATION_TYPES = [
  { label: 'IIA Member',     price: 1    }, // TODO: revert to 500 after testing
  { label: 'Non IIA Member', price: 1000 },
  { label: 'Visitor',        price: 2000 },
  { label: 'Exhibitor',      price: 3000 },
] as const;

type RegType = (typeof REGISTRATION_TYPES)[number]['label'];

const RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? '';

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

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Window { Razorpay: any; }
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
  const [paying,   setPaying]   = useState(false);
  const [apiError, setApiError] = useState('');

  const amount = REGISTRATION_TYPES.find((t) => t.label === s2.registrationType)!.price;

  // Load Razorpay script on mount
  useEffect(() => {
    if (document.getElementById('rzp-script')) return;
    const s = document.createElement('script');
    s.id  = 'rzp-script';
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.async = true;
    document.body.appendChild(s);
  }, []);

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
    if (validateStep1()) setStep(2);
  }

  // ── Step 2 — open Razorpay ───────────────────────────────────────────────────
  async function openPayment(e: React.SyntheticEvent) {
    e.preventDefault();
    setApiError('');

    if (s2.registrationType === 'IIA Member' && !s2.iiaMembershipNumber.trim()) {
      setApiError('IIA Membership Number is required for IIA Members.');
      return;
    }
    if (!window.Razorpay) {
      setApiError('Payment is loading — please wait a moment and try again.');
      return;
    }

    setPaying(true);
    try {
      // 1. Create Razorpay order
      const orderRes = await fetch('/api/payment/create-order', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, registrationType: s2.registrationType, name: s1.name, email: s1.email }),
      });
      const { orderId, error: orderErr } = await orderRes.json();
      if (!orderRes.ok || !orderId) throw new Error(orderErr ?? 'Could not initiate payment.');

      // 2. Open checkout
      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key:         RAZORPAY_KEY,
          amount:      amount * 100,
          currency:    'INR',
          order_id:    orderId,
          name:        'IIA Faridabad Centre',
          description: `Prakriti 2026 — ${s2.registrationType}`,
          prefill: {
            name:    s1.name,
            email:   s1.email,
            contact: `+91${s1.phone}`,
          },
          theme:  { color: '#1a4a1a' },
          modal: {
            backdropclose: false,
            escape: false,
            ondismiss: () => { setPaying(false); resolve(); },
          },

          handler: async (response: {
            razorpay_payment_id: string;
            razorpay_order_id:   string;
            razorpay_signature:  string;
          }) => {
            // 3. Verify payment server-side → create booking
            try {
              const verifyRes = await fetch('/api/payment/verify', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...response, ...s1, ...s2, totalAmount: amount }),
              });
              const data = await verifyRes.json();
              if (!verifyRes.ok) throw new Error(data.error ?? 'Payment verification failed.');
              onSuccess({
                bookingId:        data.bookingId,
                name:             data.name,
                email:            data.email,
                phone:            data.phone,
                organization:     data.organization,
                designation:      data.designation,
                registrationType: data.registrationType,
                amount:           data.totalAmount,
                utrNumber:        data.utrNumber,
              });
              resolve();
            } catch (err) { reject(err); }
          },
        });

        rzp.on('payment.failed', (resp: { error: { description: string } }) => {
          reject(new Error(resp.error?.description ?? 'Payment failed.'));
        });

        rzp.open();
      });

    } catch (err) {
      setApiError((err as Error).message);
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="w-full rounded-2xl shadow-xl overflow-hidden border border-green-100">

      {/* Header */}
      <div className="relative bg-[#1a4a1a] px-7 py-5 text-white overflow-hidden">
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.08]" aria-hidden>
          <defs>
            <pattern id="hg" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#c8a96e" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hg)"/>
        </svg>
        <svg className="absolute top-2 left-2 opacity-40" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M 8,0 L 0,0 L 0,8" stroke="#c8a96e" strokeWidth="1.5" fill="none"/>
        </svg>
        <svg className="absolute top-2 right-2 opacity-40" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M 8,0 L 16,0 L 16,8" stroke="#c8a96e" strokeWidth="1.5" fill="none"/>
        </svg>
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
                        checked={s1.gender === g} onChange={handleS1Change} className="accent-[#2e7d32]" />
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
          <form onSubmit={openPayment} noValidate className="space-y-5">

            {/* Registration type */}
            <div>
              <label className="label">Registration Type <Req /></label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-1.5">
                {REGISTRATION_TYPES.map((t) => (
                  <label key={t.label}
                    className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 cursor-pointer transition
                      ${s2.registrationType === t.label
                        ? 'border-[#2e7d32] bg-green-50 shadow-sm'
                        : 'border-gray-100 bg-gray-50 hover:border-gray-300'}`}>
                    <div className="flex items-center gap-2.5">
                      <input type="radio" name="registrationType" value={t.label}
                        checked={s2.registrationType === t.label}
                        onChange={(e) => setS2((p) => ({ ...p, registrationType: e.target.value as RegType }))}
                        className="accent-[#2e7d32] h-4 w-4" />
                      <span className={`text-sm font-semibold ${s2.registrationType === t.label ? 'text-[#1a4a1a]' : 'text-gray-600'}`}>
                        {t.label}
                      </span>
                    </div>
                    <span className={`text-sm font-black ${s2.registrationType === t.label ? 'text-[#2e7d32]' : 'text-gray-400'}`}>
                      ₹{t.price.toLocaleString('en-IN')}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* COA + IIA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="COA Number" id="coaNumber" name="coaNumber" value={s2.coaNumber}
                onChange={(e) => setS2((p) => ({ ...p, coaNumber: e.target.value }))}
                placeholder="CA/XXXX/XXXX" />
              <Field
                label={`IIA Membership No.${s2.registrationType === 'IIA Member' ? '' : ' (optional)'}`}
                id="iiaMembershipNumber" name="iiaMembershipNumber" value={s2.iiaMembershipNumber}
                onChange={(e) => setS2((p) => ({ ...p, iiaMembershipNumber: e.target.value }))}
                placeholder="IIA/XXXX/XXXX"
                required={s2.registrationType === 'IIA Member'} />
            </div>

            {/* ── Order summary card ── */}
            <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              {/* Top: event info */}
              <div className="bg-[#f4f7f0] px-5 py-4 border-b border-gray-100">
                <p className="text-[10px] font-bold text-[#2e7d32] uppercase tracking-widest mb-1">Order Summary</p>
                <p className="text-sm font-bold text-[#1a4a1a]">Prakriti 2026 — Entry Ticket</p>
                <p className="text-xs text-gray-500 mt-0.5">Saturday, 20 June 2026 · Saffron Hall, Faridabad</p>
              </div>

              {/* Middle: attendee + price */}
              <div className="bg-white px-5 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 mb-0.5">Attendee</p>
                  <p className="text-sm font-bold text-[#1a4a1a] truncate">{s1.name}</p>
                  <p className="text-xs text-gray-400 truncate">{s1.email}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-gray-400 mb-0.5">{s2.registrationType}</p>
                  <p className="text-3xl font-black text-[#1a4a1a] leading-none">
                    ₹{amount.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Bottom: accepted methods */}
              <div className="bg-gray-50 px-5 py-3 flex items-center gap-2 border-t border-gray-100">
                <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-[10px] text-gray-400">UPI · GPay · PhonePe · Paytm · Debit/Credit Card · Net Banking</p>
              </div>
            </div>

            {apiError && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-2.5">
                <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
                <p className="text-sm text-red-700">{apiError}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => { setStep(1); setApiError(''); }}
                className="flex-1 rounded-xl border border-gray-200 py-3.5 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition">
                ← Back
              </button>
              <button type="submit" disabled={paying}
                className="flex-[2] rounded-xl bg-[#1a4a1a] py-3.5 text-base font-bold text-white
                  hover:bg-[#2e7d32] disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2.5 transition-colors shadow-lg shadow-green-950/20">
                {paying ? (
                  <><Spinner />Processing…</>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Pay ₹{amount.toLocaleString('en-IN')} Securely
                  </>
                )}
              </button>
            </div>

            {/* Trust badge */}
            <div className="flex items-center justify-center gap-2 py-1">
              <svg className="w-3.5 h-3.5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
              </svg>
              <p className="text-[11px] text-gray-400">
                Secured by <span className="font-bold text-[#528FF0]">Razorpay</span> · 256-bit SSL encryption
              </p>
            </div>

          </form>
        )}
      </div>
    </div>
  );
}

// ── Small shared components ───────────────────────────────────────────────────
function Req() { return <span className="text-red-500 ml-0.5">*</span>; }

function Field({ label, id, name, type = 'text', value, onChange, placeholder, error, required, maxLength }: {
  label: string; id: string; name: string; type?: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string; error?: string; required?: boolean; maxLength?: number;
}) {
  return (
    <div>
      <label className="label" htmlFor={id}>{label} {required && <Req />}</label>
      <input id={id} name={name} type={type} value={value} onChange={onChange}
        placeholder={placeholder} maxLength={maxLength}
        className={`input ${error ? 'border-red-400' : ''}`} />
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
          placeholder="9876543210" className={`input rounded-l-none ${error ? 'border-red-400' : ''}`} />
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
