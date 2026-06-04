import { GoogleGenerativeAI } from '@google/generative-ai';

// ── Types ────────────────────────────────────────────────────────────────────
export interface ElementLayout {
  x:        number;  // centre-x for text, left-x for images
  y:        number;  // top-y
  maxWidth: number;
  fontSize: number;
  color:    string;
}

export interface QRLayout {
  x:    number;  // left-x
  y:    number;  // top-y
  size: number;  // square side length
}

export interface DividerLayout {
  x1: number;
  y:  number;
  x2: number;
}

export interface TicketLayout {
  name:        ElementLayout;
  designation: ElementLayout;
  bookingId:   ElementLayout;
  qrCode:      QRLayout;
  regType:     Omit<ElementLayout, 'color'>;
  divider?:    DividerLayout;
}

// ── Fallback layout (matches original PDFKit design, in 576×860pt space) ────
// Used when GEMINI_API_KEY is not set or Gemini call fails.
export const FALLBACK_LAYOUT: TicketLayout = {
  name:        { x: 288, y: 260, maxWidth: 356, fontSize: 32, color: '#1a3d21' },
  designation: { x: 288, y: 312, maxWidth: 356, fontSize: 18, color: '#1a5c2a' },
  bookingId:   { x: 288, y: 340, maxWidth: 356, fontSize: 14, color: '#1b5e20' },
  qrCode:      { x: 208, y: 374, size: 160 },
  regType:     { x: 288, y: 574, maxWidth: 356, fontSize: 26 },
  divider:     { x1: 110, y: 298, x2: 466 },
};

// ── In-memory cache — Gemini is only called once per server cold start ───────
let _cachedLayout: TicketLayout | null = null;

// ── Main export ──────────────────────────────────────────────────────────────
export async function analyzeBackgroundLayout(
  bgImageBase64: string,
): Promise<TicketLayout> {
  if (_cachedLayout) return _cachedLayout;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[gemini-layout] GEMINI_API_KEY not set — using fallback layout');
    return FALLBACK_LAYOUT;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are analysing a ticket/ID-card background image that is exactly 576×860 pixels (width × height).

Identify the safest areas where text and a QR code can be placed so they are clearly readable and do not clash with background artwork or important design elements.

Return ONLY valid JSON (no markdown fences, no explanation). Use this exact schema:
{
  "name":        { "x": <centre_x>, "y": <top_y>, "maxWidth": <px>, "fontSize": <pt 24-40>, "color": "<#hex>" },
  "designation": { "x": <centre_x>, "y": <top_y>, "maxWidth": <px>, "fontSize": <pt 14-22>, "color": "<#hex>" },
  "bookingId":   { "x": <centre_x>, "y": <top_y>, "maxWidth": <px>, "fontSize": <pt 12-16>, "color": "<#hex>" },
  "qrCode":      { "x": <left_x>,   "y": <top_y>, "size": <120 to 180> },
  "regType":     { "x": <centre_x>, "y": <top_y>, "maxWidth": <px>, "fontSize": <pt 20-28> },
  "divider":     { "x1": <left_x>,  "y": <y>,     "x2": <right_x> }
}

Placement rules:
- All coordinates are pixels; (0,0) = top-left corner
- "x" for text elements = horizontal centre of the text block
- name: large bold serif text; place in the clearest open zone
- designation: smaller text, directly below name with ~10px gap
- bookingId: small monospace, below designation with ~6px gap (inside a light-green badge)
- qrCode: place in a clear open zone, never overlapping text zones; "x" is the LEFT edge
- regType: goes below qrCode with ~10px gap; will be rendered as a white-text dark-green capsule
- divider: thin horizontal rule between name and designation
- Choose text colors that contrast with the local background — dark green (#1a3d21, #1a5c2a) on light areas, white (#ffffff) on dark areas
- Keep all elements at least 30px from image edges`;

    const result = await model.generateContent([
      { inlineData: { data: bgImageBase64, mimeType: 'image/png' } },
      prompt,
    ]);

    const raw = result.response
      .text()
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/```\s*$/, '')
      .trim();

    const layout = JSON.parse(raw) as TicketLayout;

    // Sanity-clamp values to keep them within page bounds
    layout.qrCode.size = Math.max(120, Math.min(180, layout.qrCode.size));
    layout.qrCode.x    = Math.max(0, Math.min(576 - layout.qrCode.size, layout.qrCode.x));
    layout.qrCode.y    = Math.max(0, Math.min(860 - layout.qrCode.size, layout.qrCode.y));

    _cachedLayout = layout;
    console.log('[gemini-layout] ✓ AI layout ready:', JSON.stringify(layout));
    return layout;
  } catch (err) {
    console.error('[gemini-layout] Analysis failed — using fallback layout:', err);
    return FALLBACK_LAYOUT;
  }
}

/** Call this to clear the cache (e.g. when background image changes) */
export function clearLayoutCache(): void {
  _cachedLayout = null;
}
