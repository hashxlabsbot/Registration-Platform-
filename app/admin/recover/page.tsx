'use client';

import { useState } from 'react';

const REGISTRATION_TYPES = [
  'Architect - IIA Member',
  'Architect - Non-IIA Member',
  'Non-Architect',
] as const;

interface LookupResult {
  paymentId:           string;
  status:              string;
  amount:              number;
  orderId:             string;
  name:                string;
  email:               string;
  phone:               string;
  organization:        string;
  designation:         string;
  district:            string;
  state:               string;
  pincode:             string;
  coaNumber:           string;
  iiaMembershipNumber: string;
  registrationType:    string;
  membersCount:        number;
}

interface Member {
  name:     string;
  relation: string;
  email:    string;
  phone:    string;
}

interface RecoveryForm {
  name:                string;
  email:               string;
  phone:               string;
  whatsapp:            string;
  gender:              string;
  nationality:         string;
  organization:        string;
  designation:         string;
  coaNumber:           string;
  iiaMembershipNumber: string;
  registrationType:    string;
  address:             string;
  district:            string;
  state:               string;
  pincode:             string;
}

export default function RecoverPage() {
  const [paymentId,   setPaymentId]   = useState('');
  const [looking,     setLooking]     = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [lookup,      setLookup]      = useState<LookupResult | null>(null);

  const [form, setForm] = useState<RecoveryForm>({
    name: '', email: '', phone: '', whatsapp: '', gender: '', nationality: '',
    organization: '', designation: '', coaNumber: '', iiaMembershipNumber: '',
    registrationType: 'Architect - IIA Member',
    address: '', district: '', state: '', pincode: '',
  });
  const [members,     setMembers]     = useState<Member[]>([]);
  const [sendEmail,   setSendEmail]   = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success,     setSuccess]     = useState<{ bookingId: string; verifiedAmount: number; emailErrors: string[] | null } | null>(null);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setLookupError('');
    setLookup(null);
    setSuccess(null);
    if (!paymentId.trim()) return;
    setLooking(true);
    try {
      const res = await fetch('/api/admin/lookup-payment', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ paymentId: paymentId.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Lookup failed');
      setLookup(data);
      setForm(prev => ({
        ...prev,
        name:                data.name                || '',
        email:               data.email               || '',
        phone:               data.phone               || '',
        organization:        data.organization        || '',
        designation:         data.designation         || '',
        district:            data.district            || '',
        state:               data.state               || '',
        pincode:             data.pincode             || '',
        coaNumber:           data.coaNumber           || '',
        iiaMembershipNumber: data.iiaMembershipNumber || '',
        registrationType:    REGISTRATION_TYPES.includes(data.registrationType as typeof REGISTRATION_TYPES[number])
          ? data.registrationType
          : 'Architect - IIA Member',
      }));
    } catch (err) {
      setLookupError((err as Error).message);
    } finally {
      setLooking(false);
    }
  }

  function updateField(field: keyof RecoveryForm, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function addMember() {
    setMembers(prev => [...prev, { name: '', relation: '', email: '', phone: '' }]);
  }

  function removeMember(i: number) {
    setMembers(prev => prev.filter((_, idx) => idx !== i));
  }

  function updateMember(i: number, field: keyof Member, value: string) {
    setMembers(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError('');
    if (!lookup) return;
    if (!form.name || !form.email || !form.phone || !form.registrationType) {
      setSubmitError('Name, email, phone, and registration type are required.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/recover-registration', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          razorpayPaymentId: lookup.paymentId,
          ...form,
          members,
          sendEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Recovery failed');
      setSuccess({ bookingId: data.bookingId, verifiedAmount: data.verifiedAmount, emailErrors: data.emailErrors });
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setPaymentId('');
    setLookup(null);
    setLookupError('');
    setSuccess(null);
    setSubmitError('');
    setForm({
      name: '', email: '', phone: '', whatsapp: '', gender: '', nationality: '',
      organization: '', designation: '', coaNumber: '', iiaMembershipNumber: '',
      registrationType: 'Architect - IIA Member',
      address: '', district: '', state: '', pincode: '',
    });
    setMembers([]);
    setSendEmail(true);
  }

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at 25% 15%, #0d1f0e 0%, #050d07 55%, #020507 100%)' }}>
      <div className="max-w-3xl mx-auto px-5 py-8">

        {/* Header */}
        <div className="mb-8">
          <p className="text-[10px] font-black tracking-[0.3em] uppercase text-[#c8a96e] mb-1">Recovery Tool</p>
          <h1 className="text-2xl font-black text-white tracking-tight">Recover Missing Registration</h1>
          <p className="text-sm text-white/30 mt-1">
            For users who paid via Razorpay but have no entry in the database.
            Enter their Razorpay payment ID to look up payment details, fill in any missing info, then create the registration and send the ticket.
          </p>
        </div>

        {/* Success screen */}
        {success && (
          <div
            className="rounded-2xl p-6 mb-6"
            style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(74,222,128,0.15)' }}>
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-black text-green-400 text-lg">Registration Recovered</p>
                <p className="text-sm text-white/50">Booking created and ticket emailed successfully.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <InfoBox label="Booking ID" value={success.bookingId} mono />
              <InfoBox label="Amount Verified" value={`₹${success.verifiedAmount.toLocaleString('en-IN')}`} />
            </div>
            {success.emailErrors && success.emailErrors.length > 0 && (
              <div className="rounded-xl p-3 mb-4" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
                <p className="text-xs font-bold text-yellow-400 mb-1">Email delivery warnings:</p>
                {success.emailErrors.map((e, i) => (
                  <p key={i} className="text-xs text-yellow-300/70">{e}</p>
                ))}
              </div>
            )}
            <button
              onClick={reset}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              Recover Another
            </button>
          </div>
        )}

        {!success && (
          <>
            {/* Step 1: Lookup */}
            <div
              className="rounded-2xl p-6 mb-5"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c8a96e] mb-4">Step 1 — Razorpay Payment ID</p>
              <form onSubmit={handleLookup} className="flex gap-3">
                <input
                  type="text"
                  value={paymentId}
                  onChange={e => setPaymentId(e.target.value.trim())}
                  placeholder="pay_XXXXXXXXXXXXXXXXXX"
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white font-mono placeholder-white/20 outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <button
                  type="submit"
                  disabled={looking || !paymentId.trim()}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #1a4a1a, #2e7d32)' }}
                >
                  {looking ? 'Looking up…' : 'Lookup'}
                </button>
              </form>
              {lookupError && (
                <p className="mt-3 text-sm text-red-400">{lookupError}</p>
              )}
              {lookup && (
                <div className="mt-4 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-3" style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)' }}>
                  <InfoBox label="Payment ID" value={lookup.paymentId} mono />
                  <InfoBox label="Status" value={lookup.status.toUpperCase()} valueColor="#4ade80" />
                  <InfoBox label="Amount" value={`₹${lookup.amount.toLocaleString('en-IN')}`} />
                  {lookup.name             && <InfoBox label="Name"                value={lookup.name} />}
                  {lookup.email            && <InfoBox label="Email"               value={lookup.email} />}
                  {lookup.phone            && <InfoBox label="Phone"               value={lookup.phone} />}
                  {lookup.registrationType && <InfoBox label="Reg. Type"    value={lookup.registrationType} />}
                  {lookup.organization     && <InfoBox label="Organization" value={lookup.organization} />}
                  {lookup.designation      && <InfoBox label="Designation"  value={lookup.designation} />}
                  {lookup.district         && <InfoBox label="District"     value={lookup.district} />}
                  {lookup.state            && <InfoBox label="State"               value={lookup.state} />}
                  {lookup.pincode          && <InfoBox label="Pincode"             value={lookup.pincode} />}
                  {lookup.coaNumber        && <InfoBox label="COA No."             value={lookup.coaNumber} />}
                  {lookup.iiaMembershipNumber && <InfoBox label="IIA Membership"  value={lookup.iiaMembershipNumber} />}
                  {lookup.membersCount > 0 && (
                    <InfoBox label="Members" value={`${lookup.membersCount} additional`} />
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Fill in details */}
            {lookup && (
              <form onSubmit={handleSubmit}>
                <div
                  className="rounded-2xl p-6 mb-5"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c8a96e] mb-5">Step 2 — Registration Details</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <F label="Full Name" value={form.name} onChange={v => updateField('name', v)} required placeholder="Rahul Vashisth" />
                    </div>
                    <F label="Email" type="email" value={form.email} onChange={v => updateField('email', v)} required placeholder="user@example.com" />
                    <F label="Phone (10 digits)" value={form.phone} onChange={v => updateField('phone', v)} required placeholder="9876543210" />
                    <F label="WhatsApp (optional)" value={form.whatsapp} onChange={v => updateField('whatsapp', v)} placeholder="9876543210" />

                    {/* Gender */}
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">Gender</label>
                      <div className="flex gap-4">
                        {['Male', 'Female', 'Other'].map(g => (
                          <label key={g} className="flex items-center gap-1.5 text-sm text-white/60 cursor-pointer">
                            <input
                              type="radio" name="gender" value={g}
                              checked={form.gender === g}
                              onChange={() => updateField('gender', g)}
                              className="accent-green-500"
                            />
                            {g}
                          </label>
                        ))}
                      </div>
                    </div>

                    <F label="Nationality" value={form.nationality} onChange={v => updateField('nationality', v)} placeholder="Indian" />
                    <F label="Firm / Organization" value={form.organization} onChange={v => updateField('organization', v)} placeholder="Firm Name" />
                    <F label="Designation" value={form.designation} onChange={v => updateField('designation', v)} placeholder="Principal Architect" />

                    {/* Registration type */}
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">Registration Type <span className="text-red-400">*</span></label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {REGISTRATION_TYPES.map(t => (
                          <label
                            key={t}
                            className="flex items-center gap-2 rounded-xl px-4 py-2.5 cursor-pointer transition"
                            style={form.registrationType === t
                              ? { background: 'rgba(46,125,50,0.2)', border: '1px solid rgba(74,222,128,0.3)' }
                              : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                          >
                            <input
                              type="radio" name="registrationType" value={t}
                              checked={form.registrationType === t}
                              onChange={() => updateField('registrationType', t)}
                              className="accent-green-500"
                            />
                            <span className="text-xs font-semibold text-white/70">{t}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {(form.registrationType === 'Architect - IIA Member' || form.registrationType === 'Architect - Non-IIA Member') && (
                      <>
                        <F label="COA Number" value={form.coaNumber} onChange={v => updateField('coaNumber', v)} placeholder="CA/XXXX/XXXX" />
                        {form.registrationType === 'Architect - IIA Member' && (
                          <F label="IIA Membership No." value={form.iiaMembershipNumber} onChange={v => updateField('iiaMembershipNumber', v)} placeholder="IIA/XXXX/XXXX" />
                        )}
                      </>
                    )}

                    <F label="District" value={form.district} onChange={v => updateField('district', v)} placeholder="Faridabad" />
                    <F label="State" value={form.state} onChange={v => updateField('state', v)} placeholder="Haryana" />
                    <F label="Pincode" value={form.pincode} onChange={v => updateField('pincode', v)} placeholder="121001" maxLength={6} />
                  </div>

                  {/* Additional members */}
                  {(form.registrationType === 'Architect - IIA Member' || form.registrationType === 'Architect - Non-IIA Member') && (
                    <div className="mt-5 rounded-xl p-4" style={{ background: 'rgba(200,169,110,0.05)', border: '1px solid rgba(200,169,110,0.12)' }}>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-[#c8a96e]">Additional Members</p>
                        <button
                          type="button"
                          onClick={addMember}
                          className="text-xs font-bold text-[#c8a96e] px-3 py-1.5 rounded-lg transition"
                          style={{ background: 'rgba(200,169,110,0.1)', border: '1px solid rgba(200,169,110,0.2)' }}
                        >
                          + Add Member
                        </button>
                      </div>
                      {members.length === 0 && (
                        <p className="text-xs text-white/25 text-center py-2">No additional members. Add if the primary attendee had companions.</p>
                      )}
                      {members.map((m, i) => (
                        <div key={i} className="rounded-xl p-4 mb-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div className="flex justify-between items-center mb-3">
                            <p className="text-xs font-bold text-white/50">Member {i + 1}</p>
                            <button type="button" onClick={() => removeMember(i)} className="text-xs text-red-400 hover:text-red-300 font-semibold">Remove</button>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <F label="Name" value={m.name} onChange={v => updateMember(i, 'name', v)} placeholder="Member name" />
                            <div>
                              <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">Relation</label>
                              <select
                                value={m.relation}
                                onChange={e => updateMember(i, 'relation', e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                              >
                                <option value="">Select</option>
                                <option value="Spouse">Spouse</option>
                                <option value="Friend">Friend</option>
                              </select>
                            </div>
                            <F label="Email" type="email" value={m.email} onChange={v => updateMember(i, 'email', v)} placeholder="member@example.com" />
                            <F label="Phone" value={m.phone} onChange={v => updateMember(i, 'phone', v)} placeholder="9876543210" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Step 3: Submit */}
                <div
                  className="rounded-2xl p-6"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c8a96e] mb-4">Step 3 — Confirm & Submit</p>

                  <div
                    className="rounded-xl p-4 mb-4"
                    style={{ background: 'rgba(255,193,7,0.06)', border: '1px solid rgba(255,193,7,0.15)' }}
                  >
                    <p className="text-xs font-bold text-yellow-400 mb-1">Before submitting:</p>
                    <ul className="text-xs text-yellow-300/70 space-y-0.5 list-disc list-inside">
                      <li>The payment will be re-verified with Razorpay before creating the entry.</li>
                      <li>If a registration with this payment ID already exists, the operation will fail.</li>
                      <li>Confirm all details with the attendee before proceeding.</li>
                    </ul>
                  </div>

                  <label className="flex items-center gap-3 mb-5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendEmail}
                      onChange={e => setSendEmail(e.target.checked)}
                      className="w-4 h-4 accent-green-500 rounded"
                    />
                    <span className="text-sm text-white/70">Send ticket email to the attendee</span>
                  </label>

                  {submitError && (
                    <div className="rounded-xl px-4 py-3 mb-4 flex items-start gap-2.5" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                      </svg>
                      <p className="text-sm text-red-400">{submitError}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 rounded-xl text-base font-bold text-white transition disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #1a4a1a, #2e7d32)', boxShadow: '0 4px 24px rgba(46,125,50,0.3)' }}
                  >
                    {submitting ? 'Creating Registration…' : 'Create Registration & Send Ticket'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function F({
  label, type = 'text', value, onChange, placeholder, required, maxLength,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void;
  placeholder?: string; required?: boolean; maxLength?: number;
}) {
  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-white/20 outline-none transition"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
      />
    </div>
  );
}

function InfoBox({ label, value, mono, valueColor }: {
  label: string; value: string; mono?: boolean; valueColor?: string;
}) {
  return (
    <div>
      <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-0.5">{label}</p>
      <p className={`text-xs font-bold ${mono ? 'font-mono' : ''}`} style={{ color: valueColor ?? 'rgba(255,255,255,0.75)' }}>
        {value}
      </p>
    </div>
  );
}
