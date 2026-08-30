export const REDLEB_DISPATCH_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Oswald:wght@400;500;600;700&display=swap');

.rd-root, .rd-root * { box-sizing: border-box; }
.rd-root {
  --rd-red: #c8102e;
  --rd-cream: #f3ead8;
  --rd-cover: #0d0c0b;
  --rd-ink: #1a1714;
  --rd-muted: #5c564e;
  --rd-line: #d9d0bf;
  font-family: "Libre Baskerville", Georgia, serif;
  color: var(--rd-ink);
  background: #d8d0c2;
}

.rd-loading {
  width: 210mm;
  min-height: 120px;
  margin: 0 auto;
  padding: 24px;
  text-align: center;
  font-family: Oswald, sans-serif;
  letter-spacing: 0.2em;
  font-size: 12px;
  color: var(--rd-muted);
}

.rd-page {
  width: 210mm;
  min-height: 297mm;
  height: 297mm;
  margin: 0 auto 18px;
  position: relative;
  overflow: hidden;
  background: var(--rd-cream);
  box-shadow: 0 12px 40px rgba(16,20,24,0.18);
}

.rd-page-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  pointer-events: none;
  user-select: none;
}

/* Cover — PDF page 1 is the real design; only issue/month are replaced */
.rd-cover-patch {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 34mm;
  background: var(--rd-cover);
  z-index: 2;
}

.rd-cover-dynamic {
  position: absolute;
  left: 16mm;
  right: 16mm;
  bottom: 10mm;
  z-index: 3;
  color: var(--rd-cream);
}

.rd-cover-meta {
  font-family: Oswald, sans-serif;
  font-size: 8.5px;
  letter-spacing: 0.48em;
  text-transform: uppercase;
  opacity: 0.82;
  line-height: 1.9;
}

.rd-cover-ar {
  margin-top: 4mm;
  text-align: right;
  font-size: 12px;
  letter-spacing: 0.22em;
  direction: rtl;
  opacity: 0.84;
  line-height: 1.55;
}

/* Inner pages — PDF background + cream mask over baked text */
.rd-content-mask {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 11.5mm;
  background: var(--rd-cream);
  z-index: 1;
}

.rd-inner {
  position: relative;
  z-index: 2;
  padding: 13mm 16mm 16mm;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.rd-kicker {
  font-family: Oswald, sans-serif;
  color: var(--rd-red);
  letter-spacing: 0.38em;
  font-size: 10px;
  font-weight: 600;
  margin-bottom: 2px;
}

.rd-h1 {
  font-family: "Cormorant Garamond", Georgia, serif;
  font-size: 36px;
  font-weight: 700;
  line-height: 1.08;
  margin: 4px 0 12px;
  color: var(--rd-ink);
}

.rd-body {
  font-size: 11px;
  line-height: 1.64;
  color: var(--rd-ink);
  white-space: pre-wrap;
}
.rd-body p { margin: 0 0 9px; }
.rd-greeting { font-style: italic; margin-bottom: 8px; font-size: 12px; }

.rd-sign {
  margin-top: auto;
  padding-top: 8mm;
}
.rd-sign-name {
  font-family: "Cormorant Garamond", serif;
  font-size: 24px;
  font-weight: 700;
}
.rd-sign-role {
  font-size: 11px;
  color: var(--rd-muted);
  margin-top: 2px;
  font-family: Oswald, sans-serif;
  letter-spacing: 0.08em;
}

.rd-footer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 11.5mm;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16mm;
  background: var(--rd-cream);
  border-top: 1px solid var(--rd-line);
  font-family: Oswald, sans-serif;
  font-size: 7.5px;
  letter-spacing: 0.32em;
  color: var(--rd-muted);
  text-transform: uppercase;
}

.rd-footer-strip-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  opacity: 0;
  pointer-events: none;
}

.rd-table {
  width: 100%;
  border-collapse: collapse;
  margin: 10px 0 16px;
  font-size: 11px;
}
.rd-table th, .rd-table td {
  text-align: left;
  padding: 6px 8px;
  border-bottom: 1px solid var(--rd-line);
}
.rd-table th {
  font-family: Oswald, sans-serif;
  letter-spacing: 0.14em;
  font-size: 9px;
  color: var(--rd-muted);
  text-transform: uppercase;
}
.rd-table tr:nth-child(even) td { background: rgba(200,16,46,0.05); }
.rd-lfc td { font-weight: 700; color: var(--rd-red); }

.rd-sub-kicker {
  font-family: Oswald, sans-serif;
  color: var(--rd-red);
  letter-spacing: 0.32em;
  font-size: 9px;
  font-weight: 600;
  margin: 14px 0 8px;
}

.rd-photos {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px;
  margin-top: 10px;
}
.rd-photos-2 { grid-template-columns: repeat(2, 1fr); }
.rd-photo {
  background: #1a1714;
  min-height: 38mm;
  overflow: hidden;
  position: relative;
}
.rd-photo img {
  width: 100%;
  height: 38mm;
  object-fit: cover;
  display: block;
}
.rd-photo-empty {
  height: 38mm;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #cfc6b4;
  font-family: Oswald, sans-serif;
  font-size: 9px;
  letter-spacing: 0.22em;
  background: #2a2622;
}
.rd-caption {
  font-family: Oswald, sans-serif;
  font-size: 7.5px;
  letter-spacing: 0.06em;
  padding: 4px 6px 6px;
  color: var(--rd-cream);
  background: #1a1714;
  line-height: 1.35;
}

.rd-quote {
  margin: 14px 0;
  padding: 10px 0 10px 14px;
  border-left: 3px solid var(--rd-red);
  font-style: italic;
  font-size: 15px;
  line-height: 1.45;
  font-family: "Cormorant Garamond", serif;
}
.rd-quote-mark {
  font-family: "Cormorant Garamond", serif;
  font-size: 42px;
  line-height: 0;
  color: var(--rd-red);
  opacity: 0.5;
  margin-bottom: -8px;
}
.rd-quote-author {
  margin-top: 8px;
  font-style: normal;
  font-family: Oswald, sans-serif;
  font-size: 8px;
  letter-spacing: 0.22em;
  color: var(--rd-muted);
  text-transform: uppercase;
}

.rd-results {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin: 12px 0 16px;
}
.rd-result {
  border: 1px solid var(--rd-line);
  padding: 10px 8px;
  text-align: center;
  background: #fffdf8;
}
.rd-result-score {
  font-family: Oswald, sans-serif;
  font-size: 22px;
  color: var(--rd-red);
  letter-spacing: 0.04em;
  font-weight: 600;
}
.rd-result-label {
  margin-top: 4px;
  font-size: 7.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--rd-muted);
  font-family: Oswald, sans-serif;
}

.rd-fixtures { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 10px 0 16px; }
.rd-fixture {
  border-top: 2px solid var(--rd-red);
  padding: 8px 0;
}
.rd-fixture-date {
  font-family: Oswald, sans-serif;
  font-size: 11px;
  letter-spacing: 0.16em;
  color: var(--rd-red);
}
.rd-fixture-opp { font-family: Oswald, sans-serif; font-size: 13px; margin-top: 2px; letter-spacing: 0.04em; }

/* Memorial — PDF page 9 background + centered overlay */
.rd-memorial-mask {
  position: absolute;
  inset: 0;
  background: rgba(13, 12, 11, 0.72);
  z-index: 1;
}

.rd-memorial-content {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 20mm;
  color: var(--rd-cream);
}

.rd-memorial .rd-kicker { color: #e8c9a0; }
.rd-memorial-name {
  font-family: "Cormorant Garamond", serif;
  font-size: 44px;
  margin: 12px 0 8px;
  font-weight: 700;
}
.rd-memorial-dates {
  font-family: Oswald, sans-serif;
  letter-spacing: 0.32em;
  font-size: 11px;
  opacity: 0.82;
}
.rd-memorial-ynwa {
  margin-top: 28mm;
  font-family: Oswald, sans-serif;
  letter-spacing: 0.52em;
  font-size: 10px;
  opacity: 0.85;
}

@media print {
  @page { size: A4; margin: 0; }
  html, body { margin: 0; background: white; }
  .rd-root { background: white; }
  .rd-loading { display: none; }
  .rd-page {
    margin: 0;
    box-shadow: none;
    page-break-after: always;
    break-after: page;
  }
  .rd-page:last-child { page-break-after: auto; }
  .rd-page-bg { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
}
`;
