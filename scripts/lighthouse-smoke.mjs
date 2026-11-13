#!/usr/bin/env node
/**
 * Static preview Lighthouse smoke (performance + accessibility budgets).
 * Requires: npm run build -w @kop/web, Chrome/Chromium on PATH.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as chromeLauncher from 'chrome-launcher';
import { default as lighthouse } from 'lighthouse';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distIndex = join(root, 'apps', 'web', 'dist', 'index.html');
const PORT = Number(process.env.LIGHTHOUSE_PORT ?? 4173);
/** Static offline shell — predictable budgets without API. */
const TARGET_PATH = process.env.LIGHTHOUSE_PATH ?? '/offline.html';
const BASE = `http://127.0.0.1:${PORT}${TARGET_PATH}`;

const MIN_PERFORMANCE = Number(process.env.LIGHTHOUSE_MIN_PERF ?? 0.8);
const MIN_ACCESSIBILITY = Number(process.env.LIGHTHOUSE_MIN_A11Y ?? 0.9);

if (process.env.SKIP_LIGHTHOUSE === '1') {
  console.log('[lighthouse-smoke] Skipped (SKIP_LIGHTHOUSE=1).');
  process.exit(0);
}

if (!existsSync(distIndex)) {
  console.error('[lighthouse-smoke] Run npm run build -w @kop/web first.');
  process.exit(1);
}

function waitForHttp(url, attempts = 40) {
  return new Promise((resolve, reject) => {
    let n = 0;
    const tick = async () => {
      n += 1;
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(1500) });
        if (res.ok) return resolve();
      } catch {
        /* retry */
      }
      if (n >= attempts) return reject(new Error(`Server not ready: ${url}`));
      setTimeout(tick, 500);
    };
    tick();
  });
}

function startPreview() {
  const child = spawn('npm', ['run', 'preview', '-w', '@kop/web', '--', '--port', String(PORT), '--host', '127.0.0.1'], {
    cwd: root,
    stdio: 'ignore',
    shell: true,
  });
  return child;
}

async function run() {
  const preview = startPreview();
  try {
    await waitForHttp(BASE);
    const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless', '--no-sandbox'] });
    try {
      const result = await lighthouse(BASE, {
        logLevel: 'error',
        output: 'json',
        onlyCategories: ['performance', 'accessibility'],
        port: chrome.port,
      });
      const categories = result?.lhr?.categories ?? {};
      const perf = categories.performance?.score ?? 0;
      const a11y = categories.accessibility?.score ?? 0;
      console.log(
        `[lighthouse-smoke] performance=${perf.toFixed(2)} accessibility=${a11y.toFixed(2)} (min ${MIN_PERFORMANCE}/${MIN_ACCESSIBILITY})`,
      );
      if (perf < MIN_PERFORMANCE || a11y < MIN_ACCESSIBILITY) {
        console.error('[lighthouse-smoke] Budget failed.');
        process.exit(1);
      }
      console.log('[lighthouse-smoke] OK');
    } finally {
      await chrome.kill();
    }
  } finally {
    preview.kill('SIGTERM');
  }
}

run().catch((err) => {
  console.error('[lighthouse-smoke]', err.message || err);
  process.exit(1);
});
