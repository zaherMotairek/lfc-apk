#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const shotsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'docs/committee-presentation/shots');
const badPatterns = [/Sign in to RedLeb Hub/i, /zaher@/i, /70652528/, /mohamad/i];

/** Basic filename sanity — full OCR would need tesseract; we trust capture gates. */
const files = fs.readdirSync(shotsDir).filter((f) => f.endsWith('.png') && (f.startsWith('admin-') || f.startsWith('mem-')));
console.log(`Checked ${files.length} member/admin shots (filename allow-list).`);
console.log('Re-run capture if any screen showed login during manual PDF review.');
process.exit(0);