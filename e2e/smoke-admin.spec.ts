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
  '/admin/texts',
  '/admin/settings',
  '/admin/design',
];

test.describe.configure({ timeout: 90_000 });

test.describe('admin smoke', () => {
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
