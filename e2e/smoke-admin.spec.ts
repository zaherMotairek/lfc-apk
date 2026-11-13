import { test, expect } from '@playwright/test';
import { loginWithCredentials } from './helpers/auth';
import path from 'node:path';
import fs from 'node:fs';

const ADMIN_ROUTES = [
  '/admin',
  '/admin/members',
  '/admin/applications',
  '/admin/cms',
  '/admin/news',
  '/admin/events',
  '/admin/matches',
  '/admin/newsletter',
  '/admin/texts',
  '/admin/settings',
  '/admin/design',
];

const adminUser = process.env.E2E_ADMIN_USERNAME ?? 'admin';
const adminPassword =
  process.env.E2E_ADMIN_PASSWORD ?? process.env.SEED_SUPER_ADMIN_PASSWORD ?? 'ChangeMeNow123!';

test.describe.configure({ timeout: 90_000 });

test.describe('admin smoke', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page, adminUser, adminPassword);
    if (!page.url().includes('/admin')) {
      await page.goto('/admin');
      await expect(page).toHaveURL(/\/admin/, { timeout: 15_000 });
    }
  });

  for (const route of ADMIN_ROUTES) {
    test(`admin page ${route}`, async ({ page }, testInfo) => {
      await page.goto(route, { waitUntil: 'networkidle' });
      await expect(page.locator('body')).toBeVisible();

      const slug = route.replace(/^\//, '').replace(/\//g, '-');
      const file = path.join('e2e', 'baseline', testInfo.project.name, `admin-${slug}.png`);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      await page.screenshot({ path: file, fullPage: true });
    });
  }
});
