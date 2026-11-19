import { test, expect } from '@playwright/test';

const user = process.env.QA_USER ?? '[REDACTED]';
const pass = process.env.QA_PASS ?? '[REDACTED]';

test.describe('Auth web', () => {
  test('negative: kredensial salah', async ({ page }) => {
    const errs: string[] = [];
    page.on('pageerror', (e) => errs.push(e.message));
    await page.goto('/login');
    await page.getByLabel('NIK / Email').fill('[REDACTED]');
    await page.getByLabel('Password').fill('salah');
    await page.getByRole('button', { name: 'Masuk' }).click();
    await expect(page.getByRole('alert')).toContainText(/kredensial|tidak valid/i);
    await expect(page).toHaveURL(/\/login$/);
    expect(errs).toEqual([]);
  });

  test('happy: login → logout menginvalidasi sesi', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('NIK / Email').fill(user);
    await page.getByLabel('Password').fill(pass);
    await page.getByRole('button', { name: 'Masuk' }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await page.getByRole('button', { name: /keluar|logout/i }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login$/);
  });
});
