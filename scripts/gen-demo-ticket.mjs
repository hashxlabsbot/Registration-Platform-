import PDFDocument from 'pdfkit';
import QRCode      from 'qrcode';
import sharp       from 'sharp';
import path        from 'path';
import fs          from 'fs';
import { fileURLToPath } from 'url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

/* ─── dimensions ──────────────────────────────────────────────────────────── */
const W  = 252;   // 3.5 in
const H  = 420;   // 5.83 in  (standard lanyard badge)
const CX = W / 2;

/* ─── palette ─────────────────────────────────────────────────────────────── */
const DARK   = '#071a09';
const GREEN  = '#0d2b10';
const GOLD   = '#c8a96e';
const GDIM   = '#7a5530';
const WHITE  = '#ffffff';
const CREAM  = '#f4faf4';
const MGRAY  = '#6b7c6d';
const LGRAY  = '#b0bfb2';

/* ─── per-type style ──────────────────────────────────────────────────────── */
const TYPE_STYLE = {
  'Architect - IIA Member':     { band:'#14532d', dot:'#4ade80', label:'ARCHITECT  ·  IIA MEMBER'     },
  'Architect - Non-IIA Member': { band:'#1e3a5f', dot:'#60a5fa', label:'ARCHITECT  ·  NON-IIA MEMBER' },
  "Member's Spouse":            { band:'#3b1f5e', dot:'#c084fc', label:"MEMBER'S SPOUSE"               },
  'Non-Architect':              { band:'#7c2d12', dot:'#fb923c', label:'NON-ARCHITECT'                  },
  'Special Invitee':            { band:'#3d2a06', dot:'#fbbf24', label:'SPECIAL INVITEE'               },
};

/* ─── demo data ───────────────────────────────────────────────────────────── */
const T = {
  bookingId:        'PK-DEMO2026',
  name:             'Ar. Rahul Vashisth',
  phone:            '9876543210',
  organization:     'Vashisth Design Studio',
  designation:      'Principal Architect',
  registrationType: 'Architect - IIA Member',
  totalAmount:      500,
};

/* ═══════════════════════════════════════════════════════════════════════════ */
async function main () {
  /* logo → PNG (original colours, on white circle) */
  let logo = null;
  try {
    const svg = fs.readFileSync(path.join(ROOT, 'public', 'IIA-Logo.svg'));
    logo = await sharp(svg)
      .resize(200, 200, { fit:'contain', background:{ r:255,g:255,b:255,alpha:0 } })
      .png().toBuffer();
  } catch { /* ok */ }

  /* high-res QR */
  const qr = await QRCode.toBuffer(
    JSON.stringify({ id:T.bookingId, name:T.name, type:T.registrationType, ev:'PRAKRITI2026' }),
    { width:600, margin:2, errorCorrectionLevel:'H', color:{ dark:DARK, light:WHITE } },
  );

  const doc  = new PDFDocument({ size:[W,H], margin:0 });
  const out  = fs.createWriteStream(path.join(ROOT,'demo-ticket.pdf'));
  doc.pipe(out);
  render(doc, T, logo, qr);
  doc.end();
  await new Promise(r => out.on('finish',r));
  console.log('✓  demo-ticket.pdf');
}

/* ═══════════════════════════════════════════════════════════════════════════ */
function render (doc, t, logo, qr) {
  const ts = TYPE_STYLE[t.registrationType] ?? TYPE_STYLE['Architect - IIA Member'];

  /* ── FULL CARD BACKGROUND ─────────────────────────────────────────────── */
  doc.rect(0,0,W,H).fill(DARK);

  /* very faint diagonal hatching */
  doc.save();
  for (let i = -H; i < W+H; i += 24)
    doc.moveTo(i,0).lineTo(i+H,H)
       .strokeColor(GOLD).lineWidth(0.3).opacity(0.04).stroke();
  doc.restore();

  /* ── ZONE 1 — EVENT HEADER  y: 0 → 136 ──────────────────────────────── */

  /* gold top bar */
  doc.rect(0, 0, W, 5).fill(GOLD);

  /* IIA logo in white disc, centered */
  const LD = 48;                          // logo display size
  const LCY = 5 + 8 + LD/2;             // disc center y  =  37
  doc.circle(CX, LCY, LD/2 + 6)         // white disc
     .fill(WHITE).opacity(0.12);
  doc.circle(CX, LCY, LD/2 + 5)         // gold ring
     .strokeColor(GOLD).lineWidth(0.8).opacity(0.35).stroke();
  doc.opacity(1);
  if (logo) doc.image(logo, CX - LD/2, 5+8, { width:LD, height:LD });

  /* thin rule under logo */
  doc.moveTo(CX-26, 70).lineTo(CX+26, 70)
     .strokeColor(GOLD).lineWidth(0.7).opacity(0.45).stroke().opacity(1);

  /* PRAKRITI — full-width, impactful */
  doc.fillColor(GOLD).fontSize(40).font('Helvetica-Bold')
     .text('PRAKRITI', 10, 76, { width:W-20, align:'center' });

  /* 2026 */
  doc.fillColor(WHITE).fontSize(13).font('Helvetica-Bold')
     .text('2  0  2  6', 0, 120, { width:W, align:'center' });

  /* tagline */
  doc.fillColor(GDIM).fontSize(5.4).font('Helvetica')
     .text('ARCHITECTS FOR A SUSTAINABLE TOMORROW', 0, 136,
           { width:W, align:'center', characterSpacing:0.7 });

  /* ── ZONE 2 — MEMBER-TYPE BAND  y: 150 → 178 ────────────────────────── */
  doc.rect(0, 150, W, 28).fill(ts.band);

  /* left colour tab */
  doc.rect(0, 150, 5, 28).fill(ts.dot);

  /* glowing dot */
  doc.circle(17, 164, 4.5).fill(ts.dot).opacity(0.85);
  doc.opacity(1);

  /* type label */
  doc.fillColor(WHITE).fontSize(7.5).font('Helvetica-Bold')
     .text(ts.label, 28, 161, { width:W-36, characterSpacing:1.6 });

  /* ── ZONE 3 — ATTENDEE INFO  y: 178 → 290 ───────────────────────────── */
  doc.rect(0, 178, W, 112).fill(WHITE);

  /* top accent line in type colour */
  doc.rect(0, 178, W, 2.5).fill(ts.dot).opacity(0.25);
  doc.opacity(1);

  const PX = 20, IW = W - PX*2;

  /* "REGISTERED ATTENDEE" */
  doc.fillColor(LGRAY).fontSize(5.5).font('Helvetica')
     .text('REGISTERED ATTENDEE', PX, 188, { characterSpacing:2.4 });

  /* NAME — the hero element */
  const nSz = t.name.length > 22 ? 17 : t.name.length > 18 ? 19 : 21;
  doc.fillColor(GREEN).fontSize(nSz).font('Helvetica-Bold')
     .text(t.name, PX, 198, { width:IW });

  /* designation + org — one line each */
  const lineY = 198 + nSz + 8;
  doc.fillColor(MGRAY).fontSize(7.8).font('Helvetica')
     .text(t.designation, PX, lineY, { width:IW });
  doc.fillColor(LGRAY).fontSize(7.2).font('Helvetica')
     .text(t.organization, PX, lineY+11, { width:IW });

  /* separator */
  const sepY = lineY + 30;
  doc.moveTo(PX, sepY).lineTo(W-PX, sepY)
     .strokeColor('#d8eeda').lineWidth(0.6).stroke();

  /* phone */
  doc.fillColor(LGRAY).fontSize(5.4).font('Helvetica')
     .text('MOBILE', PX, sepY+8, { characterSpacing:1.5 });
  doc.fillColor(GREEN).fontSize(8).font('Helvetica-Bold')
     .text(`+91  ${t.phone}`, PX+34, sepY+6);

  /* amount */
  if (t.totalAmount > 0) {
    doc.fillColor(LGRAY).fontSize(5.4).font('Helvetica')
       .text('FEE', W-PX-48, sepY+8, { characterSpacing:1.5 });
    doc.fillColor(GREEN).fontSize(8).font('Helvetica-Bold')
       .text(`Rs. ${t.totalAmount.toLocaleString('en-IN')}`, W-PX-46, sepY+6);
  }

  /* ── ZONE 4 — ENTRY / QR  y: 290 → 390 ─────────────────────────────── */
  doc.rect(0, 290, W, 100).fill(CREAM);

  /* perforated border */
  doc.moveTo(0, 290).lineTo(W, 290)
     .dash(3, { space:4 }).strokeColor('#a8c8a8').lineWidth(0.8).stroke().undash();

  /* ✂ cut hint */
  doc.fillColor('#a8c8a8').fontSize(7).font('Helvetica').text('✂', 4, 283);

  /* ENTRY PASS label */
  doc.fillColor(GDIM).fontSize(6).font('Helvetica-Bold')
     .text('E N T R Y   P A S S', 0, 298, { width:W, align:'center', characterSpacing:1.5 });

  /* QR code */
  const QS = 82, QX = CX - QS/2, QY = 308;
  doc.roundedRect(QX-4, QY-4, QS+8, QS+8, 3)
     .fill(WHITE).strokeColor('#c8dfc8').lineWidth(0.5).stroke();
  doc.image(qr, QX, QY, { width:QS, height:QS });

  /* gold corner L-marks */
  const CL = 8;
  [[QX-4,QY-4,CL,CL],[QX+QS+4,QY-4,-CL,CL],
   [QX-4,QY+QS+4,CL,-CL],[QX+QS+4,QY+QS+4,-CL,-CL]]
  .forEach(([x,y,dx,dy]) =>
    doc.moveTo(x,y+dy).lineTo(x,y).lineTo(x+dx,y)
       .strokeColor(GOLD).lineWidth(1.6).opacity(0.85).stroke().opacity(1));

  /* booking ID */
  doc.fillColor(LGRAY).fontSize(5.2).font('Helvetica')
     .text('BOOKING  ID', 0, QY+QS+8, { width:W, align:'center', characterSpacing:2.2 });
  doc.fillColor(GREEN).fontSize(10).font('Helvetica-Bold')
     .text(t.bookingId, 0, QY+QS+16, { width:W, align:'center', characterSpacing:2.5 });

  /* ── ZONE 5 — FOOTER  y: 390 → 420 ──────────────────────────────────── */
  doc.rect(0, 390, W, 30).fill(GREEN);
  doc.rect(0, 390, W, 1.5).fill(GOLD).opacity(0.5);
  doc.opacity(1);

  doc.fillColor(GOLD).fontSize(7).font('Helvetica-Bold')
     .text('20 JUNE 2026', 0, 400, { width:W, align:'center', characterSpacing:1.8 });
  doc.fillColor(GDIM).fontSize(5.3).font('Helvetica')
     .text('SAFFRON HALL  ·  VARDAAN GRAND  ·  FARIDABAD', 0, 411,
           { width:W, align:'center', characterSpacing:0.5 });
}

main().catch(console.error);
