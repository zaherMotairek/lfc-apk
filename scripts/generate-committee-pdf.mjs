#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'docs/committee-presentation');
const htmlPath = path.join(outDir, 'index.html');
const pdfName = process.env.COMMITTEE_PDF_FILENAME || 'RedLeb-Hub-Committee-Presentation.pdf';
const pdfPath = path.join(outDir, pdfName);
const previewDir = path.join(outDir, 'pdf-preview');

function countPdfPages(buffer) {
  const text = buffer.toString('latin1');
  const matches = text.match(/\/Type\s*\/Page\b(?!s)/g);
  return matches ? matches.length : 0;
}

async function main() {
  if (!fs.existsSync(htmlPath)) {
    throw new Error('Missing index.html — run node scripts/build-committee-html.mjs first');
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle' });
  await page.emulateMedia({ media: 'print' });

  const pdf = await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '12mm', bottom: '14mm', left: '12mm', right: '12mm' },
    displayHeaderFooter: false,
  });

  const pageCount = countPdfPages(pdf);
  const sheets = await page.locator('.sheet').count();
  if (process.env.COMMITTEE_PDF_PREVIEW === '1') {
    fs.mkdirSync(previewDir, { recursive: true });
    await page.setViewportSize({ width: 794, height: 1123 });
    for (let i = 0; i < sheets; i += 1) {
      const el = page.locator('.sheet').nth(i);
      await el.scrollIntoViewIfNeeded();
      await page.screenshot({
        path: path.join(previewDir, `page-${String(i + 1).padStart(2, '0')}.png`),
      });
    }
  }

  await browser.close();

  fs.writeFileSync(
    path.join(outDir, 'pdf-meta.json'),
    JSON.stringify({ pages: pageCount, sheets, generatedAt: new Date().toISOString() }, null, 2),
  );
  console.log(`PDF: ${pdfPath}`);
  console.log(`Pages (PDF): ${pageCount} · HTML sheets: ${sheets}`);
  console.log(`Preview PNGs: ${previewDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});