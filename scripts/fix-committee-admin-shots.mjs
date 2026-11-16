#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, devices } from '@playwright/test';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(root, 'docs/committee-presentation/shots');
const manifestPath = path.join(root, 'docs/committee-presentation/shots-manifest.json');
const adminState = path.join(root, 'docs/committee-presentation/.auth/admin.json');
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.errors = [];

const browser = await chromium.launch();
const desk = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: adminState });
const admin = await desk.newPage();
await admin.goto(`${BASE}/admin/members`);
await admin.locator('input[placeholder*="Search"]').first().fill('Jamie');
await admin.waitForTimeout(500);
await admin.getByRole('button', { name: /^Edit$/i }).first().click();
await admin.waitForTimeout(800);
await admin.screenshot({ path: path.join(OUT_DIR, 'admin-member-activity.png') });
manifest.shots['admin-member-edit'] = { file: 'admin-member-activity.png', markers: [], url: admin.url() };
await desk.close();

const mob = await browser.newContext({
  ...devices['Pixel 5'],
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  storageState: adminState,
});
const m = await mob.newPage();
await m.goto(`${BASE}/admin/texts`);
await m.waitForTimeout(800);
await m.screenshot({ path: path.join(OUT_DIR, 'admin-texts-mobile.png') });
manifest.shots['admin-texts-mobile'] = { file: 'admin-texts-mobile.png', markers: [], url: m.url() };
await browser.close();

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log('Fixed admin-member-activity + admin-texts-mobile; cleared manifest errors');