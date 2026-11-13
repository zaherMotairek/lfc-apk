import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

test('event detail when list has items', async ({ page }, testInfo) => {
  await page.goto('/events', { waitUntil: 'networkidle' });
  const link = page.locator('a[href^="/events/"]').first();
  if ((await link.count()) === 0) {
    test.skip(true, 'No seeded events — enable SEED_E2E_FIXTURES');
    return;
  }
  await link.click();
  await expect(page).toHaveURL(/\/events\//);
  const file = path.join('e2e', 'baseline', testInfo.project.name, 'event-detail.png');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await page.screenshot({ path: file, fullPage: true });
});

test('news detail when list has items', async ({ page }, testInfo) => {
  await page.goto('/news', { waitUntil: 'networkidle' });
  const link = page.locator('a[href^="/news/"]').first();
  if ((await link.count()) === 0) {
    test.skip(true, 'No seeded news — enable SEED_E2E_FIXTURES');
    return;
  }
  await link.click();
  await expect(page).toHaveURL(/\/news\//);
  const file = path.join('e2e', 'baseline', testInfo.project.name, 'news-detail.png');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await page.screenshot({ path: file, fullPage: true });
});
