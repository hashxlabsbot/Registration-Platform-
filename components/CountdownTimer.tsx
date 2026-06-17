'use client';

import { useEffect, useState } from 'react';
import { REGISTRATION_DEADLINE, isRegistrationClosed } from '@/lib/registration-status';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

function calc(): TimeLeft {
  const diff = REGISTRATION_DEADLINE - Date.now();
  if (diff <= 0 || isRegistrationClosed()) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  return {
    days:    Math.floor(diff / 86_400_000),
    hours:   Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000)  /    60_000),
    seconds: Math.floor((diff %    60_000)  /     1_000),
    expired: false,
  };
}

export default function CountdownTimer({ variant = 'dark' }: { variant?: 'dark' | 'light' }) {
  const [t, setT] = useState<TimeLeft>(calc);

  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  }, []);

  const isDark = variant === 'dark';

  if (t.expired) {
    return (
      <div
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest"
        style={isDark
          ? { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }
          : { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626' }}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
        Registrations Closed
      </div>
    );
  }

  const units = [
    { label: 'Days',    value: t.days },
    { label: 'Hours',   value: t.hours },
    { label: 'Minutes', value: t.minutes },
    { label: 'Seconds', value: t.seconds },
  ];

  const boxBg     = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(26,74,26,0.08)';
  const boxBorder = isDark ? 'rgba(200,169,110,0.2)'  : 'rgba(26,74,26,0.15)';
  const numColor  = isDark ? '#c8a96e'                : '#1a4a1a';
  const lblColor  = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(26,74,26,0.5)';
  const sepColor  = isDark ? 'rgba(200,169,110,0.5)'  : 'rgba(26,74,26,0.4)';

  return (
    <div className="flex items-center gap-1">
      {units.map((u, i) => (
        <div key={u.label} className="flex items-center gap-1">
          <div
            className="flex flex-col items-center px-2.5 py-1.5 rounded-xl min-w-[44px]"
            style={{ background: boxBg, border: `1px solid ${boxBorder}` }}
          >
            <span
              className="text-xl font-black tabular-nums leading-none"
              style={{ color: numColor }}
            >
              {String(u.value).padStart(2, '0')}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest mt-0.5" style={{ color: lblColor }}>
              {u.label}
            </span>
          </div>
          {i < 3 && (
            <span className="text-lg font-black pb-3" style={{ color: sepColor }}>:</span>
          )}
        </div>
      ))}
    </div>
  );
}
