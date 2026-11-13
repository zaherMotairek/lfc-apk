#!/usr/bin/env node
/**
 * Phase 1A guard: flag likely user-facing string literals in key UI folders.
 * CI sets CHECK_STRINGS_STRICT=1 to fail on any hint.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const WEB_SRC = join(import.meta.dirname, '..', 'apps', 'web', 'src');

const SCAN_ROOTS = [
  join(WEB_SRC, 'features', 'public'),
  join(WEB_SRC, 'features', 'members'),
  join(WEB_SRC, 'features', 'auth'),
  join(WEB_SRC, 'features', 'admin'),
  join(WEB_SRC, 'layouts'),
  join(WEB_SRC, 'components', 'layout'),
];

const IGNORE_LITERALS = new Set(['useContent', 'defaultEn', 'console.', 'className', 'http', 'https', '/api', 'kop-']);
const SKIP_FILE_MARKERS = ['useContent(', 'useContentBundle(', "from '../content/", 'from "./content/', '<T '];

const STRING_LIT = /(?:>|{\s*)(['"`])([A-Za-z][^'"`]{6,})\1/g;
const STRICT = process.env.CHECK_STRINGS_STRICT === '1' || process.env.CI === 'true';

async function walk(dir, files = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, files);
    else if (/\.tsx$/.test(entry.name)) files.push(full);
  }
  return files;
}

function isLikelyUserFacing(value) {
  if (IGNORE_LITERALS.has(value) || /^[a-z]+-[a-z]/.test(value)) return false;
  return (
    /^[A-Z][a-z]+ [a-z]/.test(value) ||
    value.includes(' member') ||
    value.includes('Sign ') ||
    value.includes('Loading') ||
    value.includes('Unable to')
  );
}

let hits = 0;
for (const root of SCAN_ROOTS) {
  const files = await walk(root);
  for (const file of files) {
    const text = await readFile(file, 'utf8');
    if (SKIP_FILE_MARKERS.some((m) => text.includes(m))) continue;
    for (const match of text.matchAll(STRING_LIT)) {
      const value = match[2];
      if (!isLikelyUserFacing(value)) continue;
      console.log(`${file}: likely hardcoded "${value.slice(0, 48)}…"`);
      hits += 1;
    }
  }
}

if (hits > 0) {
  const msg = `\n[check-user-facing-strings] ${hits} hint(s) — migrate to content registry when touching these files.`;
  console.log(msg);
  if (STRICT) {
    process.exit(1);
  }
  process.exit(0);
}
console.log('[check-user-facing-strings] OK (no obvious hints in scanned folders).');
