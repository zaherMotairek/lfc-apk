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

const memberUser = process.env.E2E_MEMBER_USERNAME ?? 'e2e.member';
const memberPassword = process.env.E2E_MEMBER_PASSWORD ?? 'E2eMember123!';

test.describe('member smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('e.g. test').fill(memberUser);
    await page.getByPlaceholder('••••••••').fill(memberPassword);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/app/, { timeout: 20_000 }).catch(() => {
      test.skip(true, 'E2E member not seeded — set SEED_E2E_FIXTURES=true and re-run prisma:seed');
    });
  });

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
