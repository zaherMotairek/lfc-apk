#!/usr/bin/env node
/**
 * Soft guard for Phase 1A: flag likely user-facing string literals in member/public layouts.
 * Not a full codemod — extend as registry coverage grows.
 */
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..', 'apps', 'web', 'src', 'features');
const SCAN_DIRS = ['public', 'members', 'auth', 'admin'];
const IGNORE = new Set(['useContent', 'defaultEn', 'console.', 'className', 'http', 'https', '/api', 'kop-']);

const STRING_LIT = /(?:>|{\s*)(['"`])([A-Za-z][^'"`]{6,})\1/g;

async function walk(dir, files = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, files);
    else if (/\.tsx$/.test(entry.name)) files.push(full);
  }
  return files;
}

let hits = 0;
for (const sub of SCAN_DIRS) {
  const base = join(ROOT, sub);
  const files = await walk(base);
  for (const file of files) {
    const text = await readFile(file, 'utf8');
    if (text.includes('useContent(') || text.includes('<T ')) continue;
    for (const match of text.matchAll(STRING_LIT)) {
      const value = match[2];
      if (IGNORE.has(value) || /^[a-z]+-[a-z]/.test(value)) continue;
      if (/^[A-Z][a-z]+ [a-z]/.test(value) || value.includes(' member') || value.includes('Sign ')) {
        console.log(`${file}: likely hardcoded "${value.slice(0, 48)}…"`);
        hits += 1;
      }
    }
  }
}

if (hits > 0) {
  console.log(`\n[check-user-facing-strings] ${hits} hint(s) — migrate to content registry when touching these files.`);
  process.exit(0);
}
console.log('[check-user-facing-strings] OK (no obvious hints in scanned folders).');
