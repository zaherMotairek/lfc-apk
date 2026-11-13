#!/usr/bin/env node
/**
 * Writes apps/web/public/offline-copy.json from @kop/shared registry defaults (run after shared build).
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sharedEntry = join(root, 'packages', 'shared', 'dist', 'index.js');

const FIELDS = ['title', 'body', 'retry', 'ribbon'];
const keys = FIELDS.map((field) => `offline.${field}`);

let CONTENT_DEFAULTS_EN;
let CONTENT_DEFAULTS_AR;
try {
  const shared = await import(pathToFileURL(sharedEntry).href);
  CONTENT_DEFAULTS_EN = shared.CONTENT_DEFAULTS_EN;
  CONTENT_DEFAULTS_AR = shared.CONTENT_DEFAULTS_AR;
} catch (err) {
  console.error('[sync-offline-copy] Build @kop/shared first.', err.message);
  process.exit(1);
}

function pick(map) {
  const out = {};
  for (let i = 0; i < FIELDS.length; i += 1) {
    out[FIELDS[i]] = map[keys[i]] ?? '';
  }
  return out;
}

const payload = {
  en: pick(CONTENT_DEFAULTS_EN),
  ar: pick(CONTENT_DEFAULTS_AR),
};

const outPath = join(root, 'apps', 'web', 'public', 'offline-copy.json');
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log('[sync-offline-copy] Wrote', outPath);
