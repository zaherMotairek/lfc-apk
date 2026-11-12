#!/usr/bin/env node
/**
 * Abort if DATABASE_URL does not point at a local PostgreSQL host.
 * Used by seed and test scripts — never run against production.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (process.env[key]) continue;
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

loadEnvFile(resolve(repoRoot, '.env'));
loadEnvFile(resolve(repoRoot, 'apps/api/.env'));

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error('[assert-local-db] DATABASE_URL is not set.');
  process.exit(1);
}

let host = '';
try {
  const normalized = url.replace(/^postgresql:\/\//i, 'http://').replace(/^postgres:\/\//i, 'http://');
  host = new URL(normalized).hostname.toLowerCase();
} catch {
  const fallback = url.match(/@([^:/?]+)/);
  host = (fallback?.[1] ?? '').toLowerCase();
}

const allowed = new Set(['localhost', '127.0.0.1', '::1']);
if (!allowed.has(host)) {
  console.error(
    `[assert-local-db] Refusing to continue: database host "${host || '(unknown)'}" is not local.`,
  );
  console.error('Use localhost or 127.0.0.1 only (e.g. postgresql://postgres:postgres@localhost:5432/kop_platform).');
  process.exit(1);
}
