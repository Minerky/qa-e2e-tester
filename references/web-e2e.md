# Web E2E (Playwright)

> Web app browser adalah **disiplin setara mobile**, bukan lampiran. Target web belum ditentukan pada sesi ini — minta `TARGET_URL` dari user. Jangan mengarang URL.

## 0. Prasyarat (Windows)

```powershell
node -v; npm -v
mkdir web-e2e; cd web-e2e
npm init -y
npm i -D @playwright/test @axe-core/playwright
npx playwright install chromium
npx playwright --version
```

```text
web-e2e/
├─ playwright.config.ts
├─ tests/{auth.setup.ts,web_auth.spec.ts,web_crud.spec.ts,web_a11y.spec.ts}
├─ auth/storageState.json      # rahasia → gitignore
├─ snapshots/
└─ .gitignore
```

```gitignore
auth/
test-results/
playwright-report/
node_modules/
.env
```

## 1. `playwright.config.ts`

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.TARGET_URL ?? 'http://localhost:3000',
    locale: 'id-ID',
    viewport: { width: 1280, height: 720 },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, dependencies: ['setup'] },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] }, dependencies: ['setup'] },
  ],
});
```

```powershell
$env:TARGET_URL='http://localhost:3000'
$env:QA_USER='[REDACTED]'; $env:QA_PASS='[REDACTED]'
npx playwright test --project=chromium
npx playwright show-report
```

## 2. Autentikasi & storageState

```ts
setup('simpan sesi login', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('NIK / Email').fill(process.env.QA_USER ?? '[REDACTED]');
  await page.getByLabel('Password').fill(process.env.QA_PASS ?? '[REDACTED]');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await page.context().storageState({ path: 'auth/storageState.json' });
});
```

`storageState.json` mengandung token → jangan pernah ditempel ke laporan. Hapus setelah sesi.

## 3. Intercept & mock API

```ts
await page.route('**/api/orders', async (route) => {
  if (route.request().method() === 'POST') {
    await route.fulfill({ status: 422, contentType: 'application/json',
      body: JSON.stringify({ message: 'Validasi gagal' }) });
    return;
  }
  await route.continue();
});
await page.route('**/api/stream', (route) => route.abort('failed'));
```

## 4. Matriks wajib

| Area | Input contoh | Ekspektasi |
|---|---|---|
| Blank submit | semua kosong | error per field, fokus field pertama |
| Format | email tanpa `@` | ditolak dengan pesan format |
| Boundary | `'A'.repeat(51)` | ditolak "maksimal 50" |
| Angka | `-1`, `1e309`, desimal | ditolak / 422 |
| Logika | awal > akhir | pesan "Tanggal awal ≤ akhir" |
| Duplikat | kode sama 2× | 409 / validasi duplikat |
| XSS | `<script>alert(1)</script>` | tampil sebagai teks, tidak 500 |
| SQLi | `' OR '1'='1` | 4xx aman, tidak ada data bocor |
| Traversal | `../../etc/passwd` | 4xx aman |
| Chaos | 5× klik Simpan | 1 record, tombol disabled |
| Error | mock 500 HTML | error generik, stack trace tidak tampil |

```ts
const errs: string[] = [];
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', e => errs.push(e.message));
expect(errs).toEqual([]);
```

## 5. Aksesibilitas WCAG 2.2 AA

```ts
const results = await new AxeBuilder({ page })
  .withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
expect(results.violations).toEqual([]);
```

Manual: keyboard-only, focus ring, `aria-label` pada ikon, label input bukan placeholder, target ≥ 24×24 px, kontras ≥ 4.5:1, modal menjebak fokus & Esc menutup.

## 6. Responsive & snapshot

```ts
const overflow = await page.evaluate(() =>
  document.documentElement.scrollWidth - window.innerWidth);
expect(overflow).toBeLessThanOrEqual(1);
await expect(page).toHaveScreenshot('login.png', { fullPage: true, animations: 'disabled' });
```

Baseline per project **dan** platform (Windows memakai Segoe UI). Update hanya setelah review manusia.

## 7. Contoh spec ringkas

```ts
// web_auth.spec.ts
test('negative: kredensial salah', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('NIK / Email').fill('[REDACTED]');
  await page.getByLabel('Password').fill('salah');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page.getByRole('alert')).toContainText(/kredensial|tidak valid/i);
});
```

## 8. CI

```yaml
- run: npx playwright test --reporter=line
  env:
    TARGET_URL: ${{ secrets.TARGET_URL }}
    QA_USER: ${{ secrets.QA_USER }}
    QA_PASS: ${{ secrets.QA_PASS }}
- uses: actions/upload-artifact@v4
  if: always()
  with: { name: playwright-evidence, path: playwright-report/ }
```

## 9. Checklist

- [ ] `TARGET_URL` dari user, bukan tebakan.
- [ ] Semua tombol/input/tab diklik minimal sekali; console & pageerror = 0.
- [ ] Negative, boundary, injection dijalankan.
- [ ] axe = 0 violation + cek keyboard manual.
- [ ] Snapshot desktop & mobile disetujui.
- [ ] `storageState.json` dihapus/redacted sebelum laporan.
