'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import jsQR from 'jsqr';

interface QRPayload {
  id:   string;
  name: string;
  type: string;
  amt:  string;
  ph:   string;
  em:   string;
  ev:   string;
}

interface CheckInResult {
  status: 'ok' | 'already' | 'not_found' | 'error';
  queued?: boolean;
  registration?: {
    name: string;
    registrationType: string;
    phone: string;
    checkinTime: string;
  };
  error?: string;
}

// ── Offline cache + queue ────────────────────────────────────────────────────
// A trimmed snapshot of every booking so scans can be validated and de-duped
// even when the venue network drops. Member state is a boolean per guest.
interface CachedReg { id: string; in: boolean; m: boolean[] }
interface QueueItem { bookingId: string; memberIndex: number }

const CACHE_KEY = 'scan_cache_v2';
const QUEUE_KEY = 'scan_queue_v2';

function loadCache(): Record<string, CachedReg> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const arr = JSON.parse(raw) as { regs: CachedReg[] };
    const map: Record<string, CachedReg> = {};
    for (const r of arr.regs) map[r.id] = r;
    return map;
  } catch { return {}; }
}
function saveCache(map: Record<string, CachedReg>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), regs: Object.values(map) }));
  } catch { /* quota — ignore */ }
}
function loadQueue(): QueueItem[] {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]'); } catch { return []; }
}
function saveQueue(q: QueueItem[]) {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch { /* ignore */ }
}

// Split "PK-XXXX-M2" into { parentId: "PK-XXXX", memberIndex: 2 }.
function parseId(id: string): { parentId: string; memberIndex: number } {
  const m = id.match(/^(.*)-M(\d+)$/);
  return m ? { parentId: m[1], memberIndex: Number(m[2]) } : { parentId: id, memberIndex: 0 };
}

export default function ScanPage() {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const activeRef = useRef(true);
  const cacheRef  = useRef<Record<string, CachedReg>>({});
  const syncingRef = useRef(false);

  const [cameraError, setCameraError] = useState('');
  const [scanned,     setScanned]     = useState<QRPayload | null>(null);
  const [result,      setResult]      = useState<CheckInResult | null>(null);
  const [checking,    setChecking]    = useState(false);
  const [scanCount,   setScanCount]   = useState(0);

  const [online,      setOnline]      = useState(true);
  const [cacheCount,  setCacheCount]  = useState(0);
  const [pending,     setPending]     = useState(0);
  const [syncing,     setSyncing]     = useState(false);

  // ── Mutate the local cache so repeat scans show "already" without network ──
  const markLocal = useCallback((parentId: string, memberIndex: number): 'ok' | 'already' | 'not_found' => {
    const reg = cacheRef.current[parentId];
    if (!reg) return 'not_found';
    if (memberIndex >= 1) {
      if (reg.m[memberIndex - 1]) return 'already';
      reg.m[memberIndex - 1] = true;
    } else {
      if (reg.in) return 'already';
      reg.in = true;
    }
    saveCache(cacheRef.current);
    return 'ok';
  }, []);

  const enqueue = useCallback((item: QueueItem) => {
    const q = loadQueue();
    q.push(item);
    saveQueue(q);
    setPending(q.length);
  }, []);

  // ── Flush queued check-ins to the server ──────────────────────────────────
  const flushQueue = useCallback(async () => {
    if (syncingRef.current || !navigator.onLine) return;
    const q = loadQueue();
    if (q.length === 0) return;
    syncingRef.current = true;
    setSyncing(true);
    const remaining: QueueItem[] = [];
    for (const item of q) {
      try {
        const res = await fetch('/api/admin/checkin', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(item),
        });
        // 4xx (e.g. not_found) → drop; 5xx / network → keep for retry
        if (!res.ok && res.status >= 500) remaining.push(item);
      } catch {
        remaining.push(item);
      }
    }
    saveQueue(remaining);
    setPending(remaining.length);
    syncingRef.current = false;
    setSyncing(false);
  }, []);

  // ── Load cache + refresh from server on mount ─────────────────────────────
  const refreshCache = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/registrations');
      if (!res.ok) return;
      const data = await res.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const map: Record<string, CachedReg> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const r of data.registrations as any[]) {
        map[r.bookingId] = {
          id:  r.bookingId,
          in:  !!r.checkedIn,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          m:   (r.members ?? []).map((mm: any) => !!mm.checkedIn),
        };
      }
      cacheRef.current = map;
      saveCache(map);
      setCacheCount(Object.keys(map).length);
    } catch { /* offline — keep whatever we loaded from localStorage */ }
  }, []);

  useEffect(() => {
    cacheRef.current = loadCache();
    setCacheCount(Object.keys(cacheRef.current).length);
    setPending(loadQueue().length);
    setOnline(navigator.onLine);
    refreshCache();
    flushQueue();

    const goOnline  = () => { setOnline(true); refreshCache(); flushQueue(); };
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    const iv = setInterval(() => { if (navigator.onLine) flushQueue(); }, 15000);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      clearInterval(iv);
    };
  }, [refreshCache, flushQueue]);

  const scan = useCallback(() => {
    if (!activeRef.current) return;
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scan);
      return;
    }
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });
    if (code?.data) {
      try {
        const payload = JSON.parse(code.data) as QRPayload;
        if (payload.id && payload.ev === 'PRAKRITI2026') {
          activeRef.current = false;
          setScanned(payload);
          return;
        }
      } catch {
        // not a valid JSON QR — keep scanning
      }
    }
    rafRef.current = requestAnimationFrame(scan);
  }, []);

  useEffect(() => {
    let stream: MediaStream | null = null;
    activeRef.current = true;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } } })
      .then((s) => {
        stream = s;
        const video = videoRef.current;
        if (video) {
          video.srcObject = s;
          video.play();
          rafRef.current = requestAnimationFrame(scan);
        }
      })
      .catch((err: Error) => {
        setCameraError(err.message ?? 'Camera permission denied.');
      });
    return () => {
      activeRef.current = false;
      cancelAnimationFrame(rafRef.current);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [scan, scanCount]);

  async function handleCheckIn() {
    if (!scanned) return;
    setChecking(true);

    const { parentId, memberIndex } = parseId(scanned.id);
    const fallbackReg = {
      name: scanned.name,
      registrationType: scanned.type,
      phone: scanned.ph,
      checkinTime: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    };

    // Offline → validate locally and queue.
    if (!navigator.onLine) {
      const status = markLocal(parentId, memberIndex);
      if (status === 'ok') enqueue({ bookingId: parentId, memberIndex });
      setResult(status === 'not_found'
        ? { status: 'not_found' }
        : { status, queued: status === 'ok', registration: fallbackReg });
      setChecking(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/checkin', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ bookingId: parentId, memberIndex }),
      });
      const data = await res.json();
      if (res.ok) {
        // keep local cache in sync for subsequent offline scans
        if (data.status === 'ok') markLocal(parentId, memberIndex);
        setResult(data.registration ? data : { ...data, registration: fallbackReg });
      } else {
        setResult({ status: 'error', error: data.error });
      }
    } catch {
      // network dropped mid-request → fall back to offline queue
      const status = markLocal(parentId, memberIndex);
      if (status === 'ok') enqueue({ bookingId: parentId, memberIndex });
      setResult(status === 'not_found'
        ? { status: 'error', error: 'Offline and ticket not in cached list.' }
        : { status, queued: status === 'ok', registration: fallbackReg });
    }
    setChecking(false);
  }

  function handleRescan() {
    setScanned(null);
    setResult(null);
    setScanCount((c) => c + 1);
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col" style={{ background: '#000' }}>

      {/* Connection / sync status bar */}
      <div className="flex items-center justify-between px-4 py-2 text-[11px] font-bold"
        style={{ background: online ? 'rgba(46,125,50,0.12)' : 'rgba(180,83,9,0.18)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="flex items-center gap-1.5" style={{ color: online ? '#4ade80' : '#fbbf24' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: online ? '#4ade80' : '#fbbf24', boxShadow: `0 0 6px ${online ? '#4ade80' : '#fbbf24'}` }} />
          {online ? 'Online' : 'Offline — scans are queued'}
        </span>
        <span className="flex items-center gap-3 text-white/40">
          {pending > 0 && (
            <span style={{ color: '#fbbf24' }}>
              {syncing ? 'Syncing…' : `${pending} queued`}
            </span>
          )}
          <span>{cacheCount} cached</span>
        </span>
      </div>

      {/* Camera area */}
      <div className="relative flex-1">
        {cameraError ? (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'radial-gradient(ellipse at center, #0d2914 0%, #050d07 60%, #000 100%)' }}>
            <div className="text-center px-8 max-w-sm">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
              </div>
              <p className="text-white font-bold text-lg mb-2">Camera Unavailable</p>
              <p className="text-white/40 text-sm">{cameraError}</p>
              <p className="text-white/25 text-xs mt-3">Allow camera access and reload the page.</p>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{ minHeight: '55vh' }}
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Scanning overlay */}
            {!scanned && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                {/* Dark vignette */}
                <div className="absolute inset-0"
                  style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.65) 100%)' }} />

                {/* Scan frame */}
                <div className="relative w-64 h-64 z-10">
                  <div className="absolute inset-0 rounded-2xl"
                    style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }} />
                  {/* Corners */}
                  <span className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-[#c8a96e] rounded-tl-2xl" />
                  <span className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-[#c8a96e] rounded-tr-2xl" />
                  <span className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-[#c8a96e] rounded-bl-2xl" />
                  <span className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-[#c8a96e] rounded-br-2xl" />
                  {/* Scan line */}
                  <div className="absolute left-3 right-3 h-[2px] rounded-full animate-scan"
                    style={{ background: 'linear-gradient(90deg, transparent, #c8a96e, transparent)' }} />
                </div>

                <p className="relative z-10 mt-6 text-white/60 text-sm font-medium tracking-wide">
                  Point camera at ticket QR code
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom panel — QR detected */}
      {scanned && !result && (
        <div
          className="rounded-t-3xl shadow-2xl px-6 pt-5 pb-8 animate-slide-up"
          style={{
            background: 'rgba(6, 16, 8, 0.97)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderBottom: 'none',
          }}
        >
          <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(255,255,255,0.12)' }} />

          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(200,169,110,0.12)', border: '1px solid rgba(200,169,110,0.2)' }}>
              <svg className="w-6 h-6 text-[#c8a96e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#c8a96e] mb-0.5">
                QR Detected{parseId(scanned.id).memberIndex >= 1 ? ' · Guest' : ''}
              </p>
              <h2 className="text-xl font-black text-white truncate">{scanned.name}</h2>
              <p className="text-sm text-white/45 mt-0.5">{scanned.type} · {scanned.amt}</p>
              <p className="text-xs text-white/25 mt-0.5 font-mono">{scanned.id}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleRescan}
              className="flex-1 py-3.5 rounded-xl text-sm font-bold transition-all text-white/50 hover:text-white"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleCheckIn}
              disabled={checking}
              className="flex-[2] py-3.5 rounded-xl font-black text-sm text-white transition-all"
              style={
                checking
                  ? { background: 'rgba(46,125,50,0.3)', cursor: 'not-allowed' }
                  : {
                      background: 'linear-gradient(135deg, #1a4a1a, #2e7d32)',
                      boxShadow: '0 4px 20px rgba(46,125,50,0.4)',
                    }
              }
            >
              {checking ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verifying…
                </span>
              ) : (
                'Check In ✓'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Bottom panel — result */}
      {result && (
        <div
          className="rounded-t-3xl shadow-2xl px-6 pt-5 pb-8 animate-slide-up"
          style={
            result.status === 'ok'
              ? { background: 'linear-gradient(160deg, #0d2e12, #1a4a1a)', border: '1px solid rgba(74,222,128,0.2)', borderBottom: 'none', boxShadow: '0 -8px 48px rgba(46,125,50,0.35)' }
              : result.status === 'already'
              ? { background: 'linear-gradient(160deg, #2d1f06, #4a3210)', border: '1px solid rgba(251,191,36,0.2)', borderBottom: 'none', boxShadow: '0 -8px 48px rgba(180,130,0,0.25)' }
              : result.status === 'not_found'
              ? { background: 'linear-gradient(160deg, #2d0a0a, #4a1010)', border: '1px solid rgba(239,68,68,0.2)', borderBottom: 'none', boxShadow: '0 -8px 48px rgba(180,0,0,0.25)' }
              : { background: 'linear-gradient(160deg, #111, #1a1a1a)', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none' }
          }
        >
          <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mb-6" />

          {result.status === 'ok' && (
            <div className="text-center">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(74,222,128,0.15)', boxShadow: '0 0 40px rgba(74,222,128,0.3)' }}
              >
                <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-green-400/60 mb-1">Access Granted</p>
              <h2 className="text-2xl font-black text-white">Welcome!</h2>
              <p className="text-green-300 font-semibold mt-1 text-lg">{result.registration?.name ?? scanned?.name}</p>
              <p className="text-green-400/50 text-sm mt-0.5">{result.registration?.registrationType ?? scanned?.type}</p>
              <p className="text-green-500/40 text-xs mt-0.5 font-mono">{scanned?.id}</p>
              {result.queued && (
                <p className="mt-2 text-[11px] font-bold text-amber-300/80">Saved offline — will sync when back online.</p>
              )}
            </div>
          )}

          {result.status === 'already' && (
            <div className="text-center">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(251,191,36,0.12)', boxShadow: '0 0 40px rgba(251,191,36,0.2)' }}
              >
                <svg className="w-10 h-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400/60 mb-1">Already Scanned</p>
              <h2 className="text-xl font-black text-white">Already Checked In</h2>
              <p className="text-amber-300/70 text-sm mt-1">{result.registration?.name ?? scanned?.name}</p>
              {result.registration?.checkinTime && (
                <p className="text-amber-400/40 text-xs mt-1">Entered at {result.registration.checkinTime}</p>
              )}
            </div>
          )}

          {result.status === 'not_found' && (
            <div className="text-center">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(239,68,68,0.12)', boxShadow: '0 0 40px rgba(239,68,68,0.2)' }}
              >
                <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-400/60 mb-1">Access Denied</p>
              <h2 className="text-xl font-black text-white">Invalid Ticket</h2>
              <p className="text-red-300/60 text-sm mt-1">Booking ID not found in the system.</p>
              <p className="text-red-400/35 text-xs mt-0.5 font-mono">{scanned?.id}</p>
            </div>
          )}

          {result.status === 'error' && (
            <div className="text-center">
              <h2 className="text-xl font-black text-white">Error</h2>
              <p className="text-white/50 text-sm mt-2">{result.error}</p>
            </div>
          )}

          <button
            onClick={handleRescan}
            className="mt-7 w-full py-4 rounded-xl font-black text-sm text-white transition-all"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.16)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'; }}
          >
            Scan Next Ticket
          </button>
        </div>
      )}

      <style jsx>{`
        @keyframes scan {
          0%   { top: 8px; }
          50%  { top: calc(100% - 8px); }
          100% { top: 8px; }
        }
        .animate-scan { animation: scan 2s ease-in-out infinite; position: absolute; }

        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);   opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.28s cubic-bezier(0.22, 1, 0.36, 1); }
      `}</style>
    </div>
  );
}
