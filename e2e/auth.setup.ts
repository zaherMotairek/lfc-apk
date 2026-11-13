import { test as setup } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { loginWithCredentials } from './helpers/auth';

const authDir = path.join('e2e', '.auth');

const adminUser = process.env.E2E_ADMIN_USERNAME ?? 'admin';
const adminPassword =
  process.env.E2E_ADMIN_PASSWORD ?? process.env.SEED_SUPER_ADMIN_PASSWORD ?? 'ChangeMeNow123!';
const memberUser = process.env.E2E_MEMBER_USERNAME ?? 'e2e.member';
const memberPassword = process.env.E2E_MEMBER_PASSWORD ?? 'E2eMember123!';

setup.beforeAll(() => {
  fs.mkdirSync(authDir, { recursive: true });
});

setup('admin session', async ({ page }) => {
  await loginWithCredentials(page, adminUser, adminPassword);
  await page.context().storageState({ path: path.join(authDir, 'admin.json') });
});

setup('member session', async ({ page }) => {
  await loginWithCredentials(page, memberUser, memberPassword);
  await page.context().storageState({ path: path.join(authDir, 'member.json') });
});
