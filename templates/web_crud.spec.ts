import { test, expect } from '@playwright/test';

test.describe('CRUD (dummy UAT)', () => {
  let createdId: string | undefined;

  test.afterEach(async ({ request }) => {
    if (!createdId) return;
    const res = await request.delete(`/api/[REDACTED]/${createdId}`);
    expect([200, 204, 404]).toContain(res.status());
    createdId = undefined;
  });

  test('validasi → injection → create → update → hapus', async ({ page }) => {
    await page.goto('/[REDACTED]');
    await page.getByRole('button', { name: 'Tambah' }).click();

    await test.step('blank submit', async () => {
      await page.getByRole('button', { name: 'Simpan' }).click();
      await expect(page.getByText(/wajib diisi/i)).toBeVisible();
    });

    await test.step('boundary + injection', async () => {
      await page.getByLabel('Kode').fill('A'.repeat(51));
      await expect(page.getByText(/maksimal 50/i)).toBeVisible();
      await page.getByLabel('Kode').fill('<script>alert(1)</script>');
      await page.getByRole('button', { name: 'Simpan' }).click();
      await expect(page.getByRole('alert')).toContainText(/karakter tidak diizinkan/i);
    });

    const kode = `QA-${Date.now()}`;
    await test.step('create', async () => {
      await page.getByLabel('Kode').fill(kode);
      const [resp] = await Promise.all([
        page.waitForResponse((r) => r.url().includes('/api/[REDACTED]') && r.request().method() === 'POST'),
        page.getByRole('button', { name: 'Simpan' }).click(),
      ]);
      expect(resp.status()).toBe(201);
      createdId = (await resp.json()).id;
    });

    await test.step('hapus', async () => {
      const row = page.getByRole('row', { name: new RegExp(kode) });
      await row.getByRole('button', { name: 'Hapus' }).click();
      await page.getByRole('button', { name: /ya, hapus|konfirmasi/i }).click();
      await expect(page.getByText(kode)).toHaveCount(0);
    });
  });
});
