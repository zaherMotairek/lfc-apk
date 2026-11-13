import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const MEMBER_ROUTES = [
  '/app',
  '/app/profile',
  '/app/membership-card',
  '/app/matches',
  '/app/leaderboard',
  '/app/community',
  '/app/notifications',
];

test.describe('member smoke', () => {
  for (const route of MEMBER_ROUTES) {
    test(`member page ${route}`, async ({ page }, testInfo) => {
      await page.goto(route, { waitUntil: 'networkidle' });
      await expect(page.locator('body')).toBeVisible();

      const slug = route.replace(/^\//, '').replace(/\//g, '-');
      const file = path.join('e2e', 'baseline', testInfo.project.name, `member-${slug}.png`);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      await page.screenshot({ path: file, fullPage: true });
    });
  }
});
