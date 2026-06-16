// Shared architectural SVG components used across pages

// ─── IIA Logo ─────────────────────────────────────────────────────────────────
export function IIAEmblem({ size = 40, variant = 'dark', className }: { size?: number; variant?: 'dark' | 'light'; className?: string }) {
  return (
    <img
      src="/IIA-Logo.svg"
      alt="IIA Logo"
      width={size}
      height={size}
      className={`shrink-0 object-contain ${className || ''}`}
      style={variant === 'light' ? { filter: 'brightness(0) invert(1)' } : undefined}
    />
  );
}

// ─── Blueprint grid overlay (for dark section backgrounds) ───────────────────
export function BlueprintGridOverlay() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
      <defs>
        <pattern id="bp-sm" width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(200,169,110,0.06)" strokeWidth="0.5" />
        </pattern>
        <pattern id="bp-lg" width="150" height="150" patternUnits="userSpaceOnUse">
          <path d="M 150 0 L 0 0 0 150" fill="none" stroke="rgba(200,169,110,0.10)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#bp-sm)" />
      <rect width="100%" height="100%" fill="url(#bp-lg)" />
    </svg>
  );
}

// ─── Compass rose (hero right decoration) ────────────────────────────────────
export function CompassRoseDecor() {
  return (
    <svg className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/3 opacity-[0.07] pointer-events-none"
      width="420" height="420" viewBox="0 0 420 420" fill="none" aria-hidden>
      <circle cx="210" cy="210" r="200" stroke="#c8a96e" strokeWidth="1.5" />
      <circle cx="210" cy="210" r="155" stroke="#c8a96e" strokeWidth="0.8" />
      <circle cx="210" cy="210" r="100" stroke="#c8a96e" strokeWidth="0.8" />
      <circle cx="210" cy="210" r="45"  stroke="#c8a96e" strokeWidth="0.8" />
      <line x1="210" y1="5"   x2="210" y2="415" stroke="#c8a96e" strokeWidth="1" />
      <line x1="5"   y1="210" x2="415" y2="210" stroke="#c8a96e" strokeWidth="1" />
      <line x1="68"  y1="68"  x2="352" y2="352" stroke="#c8a96e" strokeWidth="0.6" />
      <line x1="352" y1="68"  x2="68"  y2="352" stroke="#c8a96e" strokeWidth="0.6" />
      <polygon points="210,5 205,40 210,30 215,40" fill="#c8a96e" />
      <polygon points="210,415 205,380 210,390 215,380" fill="#c8a96e" opacity="0.5" />
      {Array.from({ length: 36 }).map((_, i) => {
        const angle = (i * 10 * Math.PI) / 180;
        const isMain = i % 9 === 0;
        const r1 = isMain ? 194 : 198;
        const x1 = 210 + r1 * Math.sin(angle);
        const y1 = 210 - r1 * Math.cos(angle);
        const x2 = 210 + 202 * Math.sin(angle);
        const y2 = 210 - 202 * Math.cos(angle);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#c8a96e" strokeWidth={isMain ? 1.5 : 0.8} />;
      })}
      <text x="207" y="22"  fill="#c8a96e" fontSize="12" fontWeight="bold" fontFamily="sans-serif">N</text>
      <text x="207" y="408" fill="#c8a96e" fontSize="12" fontFamily="sans-serif">S</text>
      <text x="10"  y="214" fill="#c8a96e" fontSize="12" fontFamily="sans-serif">W</text>
      <text x="402" y="214" fill="#c8a96e" fontSize="12" fontFamily="sans-serif">E</text>
    </svg>
  );
}

// ─── T-square drafting annotation (hero left, desktop only) ──────────────────
export function DraftingAnnotations() {
  return (
    <svg className="absolute left-4 top-8 opacity-[0.12] pointer-events-none hidden lg:block"
      width="120" height="260" viewBox="0 0 120 260" fill="none" aria-hidden>
      <rect x="58" y="0"   width="4"  height="260" rx="1" fill="#c8a96e" />
      <rect x="0"  y="18"  width="80" height="4"   rx="1" fill="#c8a96e" />
      {[40, 80, 120, 160, 200, 240].map((y) => (
        <line key={y} x1="50" y1={y} x2="70" y2={y} stroke="#c8a96e" strokeWidth="1.5" />
      ))}
      {[60, 100, 140, 180, 220].map((y) => (
        <line key={y} x1="54" y1={y} x2="66" y2={y} stroke="#c8a96e" strokeWidth="0.8" />
      ))}
      <path d="M 0 260 L 0 180 L 80 260 Z" stroke="#c8a96e" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

// ─── Architectural skyline ───────────────────────────────────────────────────
export function ArchitecturalSkyline() {
  return (
    <svg viewBox="0 0 1440 170" preserveAspectRatio="xMidYMax meet"
      fill="none" aria-hidden className="relative w-full block" style={{ marginBottom: -2 }}>
      <defs>
        <linearGradient id="bld" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2e7d32" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#133a13" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="bld2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#388e3c" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#1b5e20" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <rect x="0" y="162" width="1440" height="8" fill="#133a13" />

      {/* Far-left low block */}
      <rect x="0" y="120" width="65" height="42" fill="url(#bld)" />
      <rect x="8"  y="128" width="11" height="9" fill="white" opacity="0.07" />
      <rect x="25" y="128" width="11" height="9" fill="white" opacity="0.07" />
      <rect x="42" y="128" width="11" height="9" fill="white" opacity="0.07" />
      <rect x="8"  y="143" width="11" height="9" fill="white" opacity="0.07" />
      <rect x="25" y="143" width="11" height="9" fill="white" opacity="0.07" />
      <rect x="42" y="143" width="11" height="9" fill="white" opacity="0.07" />

      {/* Tall glass tower – left */}
      <rect x="72" y="22" width="54" height="140" fill="url(#bld)" />
      {[0,1,2,3].map(c => [0,1,2,3,4,5,6,7,8,9].map(r => (
        <rect key={`gt${c}${r}`} x={75+c*12} y={28+r*12} width={9} height={9} fill="white" opacity="0.05" />
      )))}
      <line x1="99" y1="22" x2="99" y2="8" stroke="#c8a96e" strokeWidth="1.5" opacity="0.5" />

      {/* Trees */}
      <ellipse cx="143" cy="118" rx="20" ry="26" fill="#4caf50" opacity="0.40" />
      <ellipse cx="165" cy="124" rx="15" ry="20" fill="#388e3c" opacity="0.35" />
      <rect x="140" y="140" width="5" height="22" fill="#1b5e20" opacity="0.6" />

      {/* Medium office with arched windows */}
      <rect x="188" y="72" width="88" height="90" fill="url(#bld)" />
      <path d="M 198 162 L 198 148 Q 207 140 216 148 L 216 162" fill="#0f3010" stroke="#c8a96e" strokeWidth="0.7" opacity="0.5" />
      <path d="M 222 162 L 222 148 Q 231 140 240 148 L 240 162" fill="#0f3010" stroke="#c8a96e" strokeWidth="0.7" opacity="0.5" />
      <path d="M 246 162 L 246 148 Q 255 140 264 148 L 264 162" fill="#0f3010" stroke="#c8a96e" strokeWidth="0.7" opacity="0.5" />
      {[0,1,2].map(c => [0,1,2].map(r => (
        <rect key={`mo${c}${r}`} x={194+c*26} y={78+r*16} width={16} height={11} fill="white" opacity="0.07" />
      )))}

      {/* Tree */}
      <ellipse cx="292" cy="116" rx="22" ry="28" fill="#43a047" opacity="0.40" />
      <rect x="289" y="140" width="5" height="22" fill="#1b5e20" opacity="0.6" />

      {/* Classical / Heritage building */}
      <rect x="322" y="50" width="130" height="112" fill="url(#bld2)" />
      <polygon points="318,50 387,14 452,50" fill="#1b5e20" opacity="0.7" />
      <polygon points="318,50 387,14 452,50" stroke="#c8a96e" strokeWidth="1" fill="none" opacity="0.6" />
      {[0,1,2,3,4].map(i => (
        <rect key={`hc${i}`} x={330+i*24} y={50} width={7} height={112} fill="#133a13" stroke="#c8a96e" strokeWidth="0.5" opacity="0.45" />
      ))}
      <path d="M 368 162 L 368 140 Q 387 126 406 140 L 406 162" fill="#0d2b0d" stroke="#c8a96e" strokeWidth="1" opacity="0.7" />
      <path d="M 330 110 L 330 88 Q 341 78 352 88 L 352 110" fill="#0d2b0d" stroke="#c8a96e" strokeWidth="0.7" opacity="0.5" />
      <path d="M 420 110 L 420 88 Q 431 78 442 88 L 442 110" fill="#0d2b0d" stroke="#c8a96e" strokeWidth="0.7" opacity="0.5" />
      <path d="M 374 14 Q 387 4 400 14" stroke="#c8a96e" strokeWidth="1" fill="none" opacity="0.5" />

      {/* Tallest modern tower */}
      <rect x="462" y="8" width="62" height="154" fill="url(#bld)" />
      <rect x="470" y="8" width="46" height="20" fill="#2e7d32" opacity="0.5" />
      <rect x="480" y="8" width="26" height="10" fill="#388e3c" opacity="0.4" />
      {[0,1,2,3].map(c => [0,1,2,3,4,5,6,7,8,9,10].map(r => (
        <rect key={`tt${c}${r}`} x={464+c*13} y={32+r*11} width={10} height={8} fill="white" opacity="0.05" />
      )))}

      {/* Trees */}
      <ellipse cx="542" cy="116" rx="18" ry="26" fill="#4caf50" opacity="0.38" />
      <ellipse cx="565" cy="122" rx="14" ry="20" fill="#388e3c" opacity="0.33" />
      <rect x="539" y="139" width="5" height="23" fill="#1b5e20" opacity="0.55" />

      {/* Green building with rooftop garden */}
      <rect x="585" y="58" width="92" height="104" fill="url(#bld)" />
      <rect x="585" y="50" width="92" height="12" fill="#388e3c" opacity="0.8" />
      <ellipse cx="602" cy="43" rx="10" ry="14" fill="#4caf50" opacity="0.60" />
      <ellipse cx="625" cy="45" rx="9"  ry="12" fill="#43a047" opacity="0.55" />
      <ellipse cx="650" cy="42" rx="11" ry="15" fill="#4caf50" opacity="0.60" />
      {[0,1,2,3].map(c => [0,1,2,3,4].map(r => (
        <rect key={`gb${c}${r}`} x={590+c*20} y={64+r*16} width={14} height={11} fill="white" opacity="0.06" />
      )))}

      {/* Mid-right building */}
      <rect x="690" y="88" width="72" height="74" fill="url(#bld)" />
      {[0,1,2].map(c => [0,1,2].map(r => (
        <rect key={`mr${c}${r}`} x={695+c*22} y={95+r*17} width={14} height={12} fill="white" opacity="0.07" />
      )))}

      {/* Tree */}
      <ellipse cx="778" cy="122" rx="20" ry="26" fill="#43a047" opacity="0.38" />
      <rect x="775" y="143" width="5" height="19" fill="#1b5e20" opacity="0.55" />

      {/* Tall right tower */}
      <rect x="806" y="28" width="60" height="134" fill="url(#bld)" />
      {[0,1,2,3].map(c => [0,1,2,3,4,5,6,7,8].map(r => (
        <rect key={`tr${c}${r}`} x={809+c*13} y={34+r*13} width={10} height={10} fill="white" opacity="0.05" />
      )))}
      <line x1="836" y1="28" x2="836" y2="12" stroke="#c8a96e" strokeWidth="1.2" opacity="0.4" />

      {/* Right office block */}
      <rect x="878" y="82" width="82" height="80" fill="url(#bld)" />
      {[0,1,2,3].map(c => [0,1,2].map(r => (
        <rect key={`ro${c}${r}`} x={883+c*18} y={90+r*18} width={12} height={13} fill="white" opacity="0.07" />
      )))}

      {/* Narrow tower */}
      <rect x="972" y="50" width="40" height="112" fill="url(#bld)" />
      {[0,1].map(c => [0,1,2,3,4,5,6].map(r => (
        <rect key={`nt${c}${r}`} x={976+c*16} y={56+r*14} width={11} height={10} fill="white" opacity="0.06" />
      )))}

      {/* Trees right */}
      <ellipse cx="1026" cy="120" rx="19" ry="24" fill="#4caf50" opacity="0.35" />
      <ellipse cx="1050" cy="125" rx="15" ry="20" fill="#388e3c" opacity="0.30" />

      {/* Far-right fading */}
      <rect x="1075" y="70"  width="70" height="92" fill="url(#bld)" opacity="0.80" />
      <rect x="1158" y="95"  width="58" height="67" fill="url(#bld)" opacity="0.60" />
      <rect x="1228" y="78"  width="54" height="84" fill="url(#bld)" opacity="0.45" />
      <rect x="1294" y="108" width="80" height="54" fill="url(#bld)" opacity="0.30" />
      <rect x="1386" y="90"  width="54" height="72" fill="url(#bld)" opacity="0.20" />

      {/* Elevation annotation */}
      <line x1="72" y1="166" x2="525" y2="166" stroke="#c8a96e" strokeWidth="0.6" opacity="0.25" />
      <line x1="72"  y1="163" x2="72"  y2="169" stroke="#c8a96e" strokeWidth="0.8" opacity="0.3" />
      <line x1="525" y1="163" x2="525" y2="169" stroke="#c8a96e" strokeWidth="0.8" opacity="0.3" />
      <text x="298" y="162" textAnchor="middle" fontSize="5" fill="#c8a96e" opacity="0.35" fontFamily="monospace">ELEVATION A–A</text>
    </svg>
  );
}

// ─── Blueprint corner marks ───────────────────────────────────────────────────
export function CornerMark({ pos, color = 'green' }: { pos: 'tl' | 'tr' | 'bl' | 'br'; color?: 'green' | 'gold' }) {
  const c = color === 'gold' ? '#c8a96e' : '#2e7d32';
  const size = 10;
  const styles: Record<string, string> = { tl: 'top-2 left-2', tr: 'top-2 right-2', bl: 'bottom-2 left-2', br: 'bottom-2 right-2' };
  const rotate: Record<string, string> = { tl: '0', tr: '90', bl: '270', br: '180' };
  return (
    <svg className={`absolute ${styles[pos]} pointer-events-none opacity-40`}
      width={size * 2} height={size * 2} viewBox={`0 0 ${size * 2} ${size * 2}`} aria-hidden>
      <g transform={`rotate(${rotate[pos]}, ${size}, ${size})`}>
        <path d={`M ${size},0 L 0,0 L 0,${size}`} stroke={c} strokeWidth="1.5" fill="none" />
      </g>
    </svg>
  );
}

// ─── Building Elevation Illustration (About section) ─────────────────────────
export function BuildingElevation() {
  return (
    <svg viewBox="0 0 280 340" fill="none" className="w-full max-w-[260px] mx-auto" aria-hidden>
      {/* Ground */}
      <line x1="10" y1="330" x2="270" y2="330" stroke="#1a4a1a" strokeWidth="2" />
      {/* Plinth */}
      <rect x="22" y="316" width="236" height="14" rx="1" fill="#e8f5e9" stroke="#1a4a1a" strokeWidth="1" />

      {/* Main body */}
      <rect x="30" y="78" width="220" height="238" fill="#f1f8e9" stroke="#1a4a1a" strokeWidth="1.2" />

      {/* Entablature */}
      <rect x="22" y="72" width="236" height="10" rx="0.5" fill="#d4edda" stroke="#1a4a1a" strokeWidth="1" />

      {/* Pediment */}
      <polygon points="20,72 140,22 260,72" fill="#e8f5e9" stroke="#1a4a1a" strokeWidth="1.2" />
      {/* Pediment tympanum details */}
      <line x1="60" y1="62" x2="100" y2="44" stroke="#1a4a1a" strokeWidth="0.5" opacity="0.4" />
      <line x1="180" y1="44" x2="220" y2="62" stroke="#1a4a1a" strokeWidth="0.5" opacity="0.4" />

      {/* Columns — 6 pilasters */}
      {[0,1,2,3,4,5].map(i => (
        <g key={i}>
          <rect x={38+i*38} y={72} width={10} height={238} rx="1" fill="#e0f0e0" stroke="#1a4a1a" strokeWidth="0.6" opacity="0.9" />
          {/* Capital */}
          <rect x={34+i*38} y={69} width={18} height={6} rx="0.5" fill="#d4edda" stroke="#1a4a1a" strokeWidth="0.5" />
          {/* Base */}
          <rect x={34+i*38} y={309} width={18} height={7} rx="0.5" fill="#d4edda" stroke="#1a4a1a" strokeWidth="0.5" />
        </g>
      ))}

      {/* Ground floor: 3 arched doorways */}
      <path d="M 42 316 L 42 282 Q 58 262 74 282 L 74 316" fill="white" stroke="#1a4a1a" strokeWidth="1" />
      <path d="M 116 316 L 116 275 Q 140 253 164 275 L 164 316" fill="white" stroke="#1a4a1a" strokeWidth="1.2" />
      <path d="M 206 316 L 206 282 Q 222 262 238 282 L 238 316" fill="white" stroke="#1a4a1a" strokeWidth="1" />
      {/* Door keystone */}
      <polygon points="132,253 140,246 148,253 140,258" fill="#1a4a1a" opacity="0.25" />

      {/* First floor: 5 arched windows */}
      {[42, 82, 120, 158, 198].map((x, i) => (
        <g key={i}>
          <rect x={x} y={185} width={28} height={42} rx="1" fill="white" stroke="#1a4a1a" strokeWidth="0.8" />
          <path d={`M ${x},196 L ${x},188 Q ${x+14},180 ${x+28},188 L ${x+28},196`}
            fill="white" stroke="#1a4a1a" strokeWidth="0.8" />
          {/* Sill */}
          <rect x={x-2} y={226} width={32} height={3} rx="0.5" fill="#d4edda" stroke="#1a4a1a" strokeWidth="0.4" />
        </g>
      ))}

      {/* Second floor: 5 rectangular windows */}
      {[44, 84, 122, 160, 200].map((x, i) => (
        <g key={i}>
          <rect x={x} y={108} width={24} height={38} rx="1" fill="white" stroke="#1a4a1a" strokeWidth="0.8" />
          {/* Lintel */}
          <rect x={x-2} y={105} width={28} height={4} rx="0.5" fill="#d4edda" stroke="#1a4a1a" strokeWidth="0.4" />
          {/* Sill */}
          <rect x={x-2} y={145} width={28} height={3} rx="0.5" fill="#d4edda" stroke="#1a4a1a" strokeWidth="0.4" />
          {/* Glazing bar */}
          <line x1={x+12} y1={108} x2={x+12} y2={146} stroke="#1a4a1a" strokeWidth="0.4" opacity="0.5" />
          <line x1={x} y1={127} x2={x+24} y2={127} stroke="#1a4a1a" strokeWidth="0.4" opacity="0.5" />
        </g>
      ))}

      {/* String course between floors */}
      <rect x="30" y="174" width="220" height="6" rx="0.5" fill="#d4edda" stroke="#1a4a1a" strokeWidth="0.6" />
      <rect x="30" y="97"  width="220" height="5" rx="0.5" fill="#d4edda" stroke="#1a4a1a" strokeWidth="0.6" />

      {/* Parapet above entablature */}
      <rect x="22" y="55" width="236" height="8" rx="0.5" fill="#e8f5e9" stroke="#1a4a1a" strokeWidth="0.8" />

      {/* Measurement lines */}
      <line x1="268" y1="78"  x2="268" y2="316" stroke="#c8a96e" strokeWidth="0.7" strokeDasharray="3 2" opacity="0.5" />
      <line x1="264" y1="78"  x2="272" y2="78"  stroke="#c8a96e" strokeWidth="0.7" opacity="0.5" />
      <line x1="264" y1="316" x2="272" y2="316" stroke="#c8a96e" strokeWidth="0.7" opacity="0.5" />
      <text x="274" y="200" fontSize="5.5" fill="#c8a96e" opacity="0.6" fontFamily="monospace" textAnchor="start"
        transform="rotate(90,274,200)">MAIN FACADE</text>

      {/* Ref tag */}
      <rect x="8" y="8" width="70" height="14" rx="2" fill="none" stroke="#c8a96e" strokeWidth="0.6" opacity="0.4" />
      <text x="43" y="18" textAnchor="middle" fontSize="5" fill="#c8a96e" opacity="0.5" fontFamily="monospace">IIA-2026 / ELEV-N</text>
    </svg>
  );
}

// ─── Highlight icons (architecture-themed) ────────────────────────────────────
export function AmphitheaterIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M3 17 Q10 11 17 17"/><path d="M1 14 Q10 6 19 14"/>
      <rect x="8" y="14" width="4" height="3" rx="0.5"/><line x1="10" y1="13" x2="10" y2="11"/>
    </svg>
  );
}
export function CompassIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <circle cx="10" cy="10" r="8"/>
      <circle cx="10" cy="10" r="1" fill="currentColor" stroke="none"/>
      <line x1="10" y1="2"  x2="10" y2="5"/><line x1="10" y1="15" x2="10" y2="18"/>
      <line x1="2"  y1="10" x2="5"  y2="10"/><line x1="15" y1="10" x2="18" y2="10"/>
      <path d="M10 2 L8.5 6 L10 5 L11.5 6 Z" fill="currentColor" stroke="none"/>
    </svg>
  );
}
export function ArchIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M3 18 L3 10 Q10 2 17 10 L17 18"/>
      <line x1="1" y1="18" x2="19" y2="18"/><line x1="3" y1="14" x2="17" y2="14"/>
      <line x1="8" y1="14" x2="8" y2="18"/><line x1="12" y1="14" x2="12" y2="18"/>
    </svg>
  );
}
export function ElevationIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <line x1="1" y1="18" x2="19" y2="18"/>
      <rect x="2" y="12" width="5" height="6"/><rect x="8" y="5" width="5" height="13"/>
      <rect x="14" y="9" width="4" height="9"/>
      <rect x="9.5" y="7" width="2" height="3"/><rect x="3" y="14" width="2" height="2"/>
    </svg>
  );
}
export function ColumnsIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <rect x="1" y="16" width="18" height="2" rx="0.5"/><rect x="1" y="5" width="18" height="2" rx="0.5"/>
      <path d="M1 5 L10 1 L19 5"/>
      <rect x="3"    y="7" width="2.5" height="9"/><rect x="7.5"  y="7" width="2.5" height="9"/>
      <rect x="12"   y="7" width="2.5" height="9"/><rect x="16.5" y="7" width="2.5" height="9"/>
    </svg>
  );
}
export function SkylineNightIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="4"  cy="3"   r="0.5" fill="currentColor" stroke="none"/>
      <circle cx="11" cy="2"   r="0.5" fill="currentColor" stroke="none"/>
      <circle cx="17" cy="3.5" r="0.5" fill="currentColor" stroke="none"/>
      <path d="M0 18 L0 13 L3 13 L3 10 L6 10 L6 7 L9 7 L9 13 L12 13 L12 8 L15 8 L15 13 L17 13 L17 11 L20 11 L20 18 Z"
        fill="currentColor" opacity="0.5" stroke="none"/>
    </svg>
  );
}
