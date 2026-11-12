import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/committee',
  '/events',
  '/gallery',
  '/news',
  '/newsletter',
  '/membership',
  '/membership/apply',
  '/contact',
  '/login',
  '/signup',
];

function baselinePath(name: string, project: string) {
  return path.join('e2e', 'baseline', project, `${name}.png`);
}

for (const route of PUBLIC_ROUTES) {
  test(`public smoke ${route}`, async ({ page }, testInfo) => {
    const response = await page.goto(route, { waitUntil: 'networkidle' });
    expect(response?.ok() ?? true).toBeTruthy();
    await expect(page.locator('body')).toBeVisible();

    const slug = route === '/' ? 'home' : route.replace(/^\//, '').replace(/\//g, '-');
    const file = baselinePath(slug, testInfo.project.name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    await page.screenshot({ path: file, fullPage: true });
  });
}
