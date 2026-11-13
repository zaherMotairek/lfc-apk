import { test, expect } from '@playwright/test';

test('public home supports Arabic RTL', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const switcher = page.getByLabel('Site language');
  await expect(switcher).toBeVisible();
  await switcher.selectOption('ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
});

test('English restores LTR', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const switcher = page.getByLabel('Site language');
  await switcher.selectOption('ar');
  await switcher.selectOption('en');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
});
