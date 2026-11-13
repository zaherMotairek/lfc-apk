import { expect, type Page } from '@playwright/test';

export async function loginWithCredentials(page: Page, username: string, password: string) {
  await page.goto('/login');
  await page.getByPlaceholder('e.g. test').fill(username);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: /^Sign in$/i }).click();
  await expect(page).toHaveURL(/\/(app|admin)/, { timeout: 35_000 });
}
