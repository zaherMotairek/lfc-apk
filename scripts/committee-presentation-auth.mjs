#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const authDir = path.join(root, 'docs/committee-presentation/.auth');
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';

const ADMIN_USER = process.env.E2E_ADMIN_USERNAME ?? 'admin';
const ADMIN_PASS =
  process.env.E2E_ADMIN_PASSWORD ?? process.env.SEED_SUPER_ADMIN_PASSWORD ?? 'ChangeMeNow123!';
const MEMBER_USER = process.env.E2E_MEMBER_USERNAME ?? 'e2e.member';
const MEMBER_PASS = process.env.E2E_MEMBER_PASSWORD ?? 'E2eMember123!';

async function login(page, username, password) {
  await page.goto(`${BASE}/login`);
  await page.getByPlaceholder('e.g. test').fill(username);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: /^Sign in$/i }).click();
  await page.waitForURL(/\/(app|admin)/, { timeout: 60_000 });
}

async function main() {
  fs.mkdirSync(authDir, { recursive: true });
  const browser = await chromium.launch();
  const adminCtx = await browser.newContext();
  const adminPage = await adminCtx.newPage();
  await login(adminPage, ADMIN_USER, ADMIN_PASS);
  await adminCtx.storageState({ path: path.join(authDir, 'admin.json') });

  const memberCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const memberPage = await memberCtx.newPage();
  await login(memberPage, MEMBER_USER, MEMBER_PASS);
  await memberCtx.storageState({ path: path.join(authDir, 'member.json') });

  await browser.close();
  console.log('[committee-presentation-auth] Wrote admin.json + member.json');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});