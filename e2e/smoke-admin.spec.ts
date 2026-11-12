import { test, expect } from '@playwright/test';
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
];

const adminUser = process.env.E2E_ADMIN_USERNAME ?? 'admin';
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? process.env.SEED_SUPER_ADMIN_PASSWORD ?? 'ChangeMeNow123!';

test.describe('admin smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('e.g. test').fill(adminUser);
    await page.getByPlaceholder('••••••••').fill(adminPassword);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/(admin|app)/, { timeout: 20_000 });
    if (!page.url().includes('/admin')) {
      await page.goto('/admin');
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
