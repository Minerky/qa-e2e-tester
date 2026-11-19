# Changelog — qa-e2e-tester

Format: `## [YYYY-MM-DD] — Judul`, dengan `Added / Changed / Fixed / Decided / Notes`. Entri terbaru di atas.

## [2026-11-19] — Auto-resolve input: user cukup perintah + dokumen pendukung

### Added

- Aturan **auto-resolve** di `SKILL.md` §0.2: URL, kredensial/PIN/OTP, serial ADB, package, dan test case diambil dari perintah + dokumen pendukung workspace. User tidak menyet env atau mengubah kode.
- `references/intake-and-roe.md` §4.1: tabel sumber auto-resolve dari FSD/PRD/User Guide/Test Scripts/approval.
- Catatan `references/web-e2e.md`: eksekusi langsung lewat tool Playwright browser tanpa `npm install`; template CLI tetap dipakai untuk suite reproducible.

### Changed

- Perintah jadi `e2e web [url]` / `e2e mobile [serial|app]` (argumen opsional).
- Intake & RoE tidak lagi menunggu questionnaire diisi user; diisi dari dokumen, tanya hanya untuk yang benar-benar missing.
- `references/reporting.md`: kredensial hasil auto-resolve tidak masuk DOCX, cukup keputusan resolusinya.

### Decided

- "Overpowered" = user perintah + dokumen, agent yang resolve dan jalan — bukan user yang konfigurasi tool.

## [2026-11-19] — Mode perintah `e2e web` / `e2e mobile` / `e2e all` + testability checklist

### Added

- `SKILL.md` §0.2 **Cara Memerintahkan**: routing eksplisit `e2e web <url>`, `e2e mobile <serial|app>`, `e2e all` plus alias Indonesia/Inggris; gate pra-eksekusi dan pelabelan `PASS`/`FAIL`/`BLOCKED`.
- Testability checklist E2E penuh di `references/web-e2e.md` §10 dan `references/mobile-e2e.md` §8 (auth deterministik, OTP test, data reset, selector stabil, network/TLS, matrix device, gate hasil).
- Frontmatter `description` diperluas agar skill aktif saat user memerintahkan "e2e web"/"e2e mobile" secara langsung.

### Changed

- `references/reporting.md`: tegas bahwa hasil kedua mode masuk **satu** `ai/triage.json` → satu DOCX; `BLOCKED` wajib dilaporkan, tidak dihitung `PASS`.

### Decided

- Satu skill menangani dua mode E2E; tidak ada skill/laporan terpisah untuk web dan mobile.
- "E2E penuh" baru diklaim kalau test hook tersedia; tanpa itu hasilnya **E2E luas** dengan bagian `BLOCKED`.

### Notes

- Web masih menunggu `TARGET_URL` dari user; prosedur dan template sudah siap dipakai.

## [2026-11-19] — Perluasan menjadi Application Quality, Security, Network & Performance Assessment (mobile + web)

### Added

- **8 modul reference**:
  1. `references/intake-and-roe.md` — questionnaire, authorization, stop condition, template RoE.
  2. `references/mobile-e2e.md` — helper `qa_ui.py`, ADB MuMu, eksplorasi drawer/tab/detail, opsi iOS.
  3. `references/web-e2e.md` — Playwright `.spec.ts`, `storageState`, mock API, a11y WCAG 2.2 AA, snapshot, CI.
  4. `references/api-testing.md` — kontrak REST, authz/IDOR, fuzz aman UAT, rate limit, replay, p95.
  5. `references/security-pentest.md` — MASVS/Mobile Top 10/ASVS, static + dynamic, MITM/Frida, CVSS v3.1.
  6. `references/network-assessment.md` — proxy+CA, inventaris endpoint, TLS/header, throttling, replay, p95.
  7. `references/performance.md` — startup, jank, PSS/CPU/baterai, monkey/soak, Lighthouse, k6.
  8. `references/reporting.md` — satu laporan gabungan, triage schema, redaction, embed DOCX.
- `scripts/qa_ui.py` — helper ADB (serial dari `mumu-cli`, dump/tap/text/shot/activity/log) dengan redaction otomatis.
- `scripts/redact.py` — helper redaction token/NIK/HP/email/secret.
- `scripts/triage_schema.json` — skema `ai/triage.json`.
- `templates/playwright.config.ts`, `web_auth.spec.ts`, `web_crud.spec.ts`, `k6-load.js`, `report-outline.md`.
- Audit trail wajib: `ai/audit-log.jsonl` untuk setiap probe/scan.

### Changed

- Fokus awal E2E mobile diperluas menjadi **Application Quality, Security, Network & Performance Assessment** untuk **mobile + web + API**.
- Web browser naik menjadi disiplin setara mobile. Karena target web belum ditentukan, modul web meminta `TARGET_URL` dari user dan melarang mengarang URL.
- Kredensial, token, NIK, dan PIN uji distandardisasi `[REDACTED]` via environment variable; `storageState.json` masuk `.gitignore`.
- `curl.exe` dipakai eksplisit di contoh PowerShell.
- `Likelihood × Impact` dipakai seragam untuk functional, security, network, dan performance.

### Decided

- **Satu laporan gabungan** (`Laporan-[TARGET]-v[VER]-[TANGGAL].docx`), bukan laporan per disiplin. Alasan: pembaca butuh satu *production-readiness verdict*.
- Satu source of truth temuan: `ai/triage.json`; DOCX dan risk register turunan.
- Agent/model tidak boleh mengklaim membaca screenshot. XML uiautomator, response JSON, dan log adalah sumber kebenaran; screenshot tetap wajib sebagai bukti manusia.
- Fuzz/scan aktif hanya UAT dengan izin tertulis.
- Port ADB MuMu harus dideteksi via `mumu-cli`, bukan diasumsikan `7555`.

### Notes

- Fallback baru: saat ADB TCP offline setelah skenario airplane mode, pakai `mumu-cli sh --vmindex 0 --cmd "settings put global airplane_mode_on 0"` + broadcast, lalu set proxy `:0`, sebelum reconnect. Didokumentasikan di `references/mobile-e2e.md` dan `references/network-assessment.md`.
- Template iOS disiapkan dari Windows tetapi belum divalidasi sampai dijalankan di macOS + Xcode.
- Sesi validasi pertama memakai DCT FLM v1.53 di MuMu `127.0.0.1:16384`; temuan dan bukti masuk satu laporan gabungan.
