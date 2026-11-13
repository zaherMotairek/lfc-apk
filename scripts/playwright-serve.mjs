#!/usr/bin/env node
/**
 * Starts API + Vite for Playwright (single process tree; Playwright kills on exit).
 */
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const shell = process.platform === 'win32';

const children = [
  spawn(npm, ['run', 'dev:api'], { cwd: root, stdio: 'inherit', shell }),
  spawn(npm, ['run', 'dev', '-w', '@kop/web'], { cwd: root, stdio: 'inherit', shell }),
];

function shutdown(code = 0) {
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

for (const child of children) {
  child.on('exit', (code) => {
    if (code && code !== 0) shutdown(code);
  });
}
