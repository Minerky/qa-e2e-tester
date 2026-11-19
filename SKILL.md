---
name: qa-e2e-tester
description: Use when performing end-to-end (E2E) QA testing on web, Android, and iOS applications (via Playwright MCP, ADB, Appium/XCTest), testing backend & mobile APIs (REST/JSON/HTTP), pentesting authorized mobile/web/network targets with AI-assisted triage, testing from FSD/PRD/User Guide/Test Scripts, APK/IPA, or pure URL, handling DCT mobile apps with mandatory Test Mode (PIN 789123), generating automated test scripts (.spec.ts), and producing structured Word (.docx)/Markdown reports with exhaustive validation, risk scoring, and embedded screenshots.
---

# Universal QA E2E Testing & Reporting Skill (`qa-e2e-tester`)

Skill ini adalah standar operasional pengujian kualitas perangkat lunak (Software Quality Assurance) tingkat lanjut untuk **Web, Mobile Android & iOS (APK/IPA, ADB, Appium/XCTest), Backend API, dan Pentest Mobile/Web/Jaringan berbasis AI** yang **WAJIB MENGEKSEKUSI PENGUJIAN SECARA TOTALITAS & EXHAUSTIVE (ZERO MISSED DEFECTS)**. Tidak boleh ada hal kecil, tombol, interaksi, validasi, endpoint, port, atau konfigurasi yang dilewatkan. Setiap komponen UI, modal, tab, filter, error dialog, input form, format data, boundary, permission, request/response API, artifact mobile, dan permukaan jaringan harus diuji secara menyeluruh dengan **Playwright MCP / Android ADB / Appium / HTTP API Client / tool pentest yang diizinkan** dan dilaporkan lengkap beserta bukti screenshot/log. Temuan keamanan wajib diberi **lokasi eksplisit, risk score, dampak bisnis, dan rekomendasi**, bukan sekadar status V/X.

---

## 0. GUARDRAIL WAJIB (LEGAL & SAFETY)
- **Izin tertulis**: Jalankan pentest/scan HANYA pada target milik sendiri atau yang memiliki authorization/scope tertulis (URL, IP, hostname, APK/IPA, akun uji). Jika tidak ada izin, berhenti dan minta konfirmasi.
- **Batasi scope**: Tidak boleh memindai host di luar daftar yang disetujui. Tidak boleh melakukan eksploitasi destruktif, DDoS, ransomware, defacement, atau penghapusan data produksi.
- **Mode aman default**: Gunakan probe deteksi (payload non-destruktif, scan pasif/ringan, validasi header/konfigurasi). Eksploitasi aktif hanya boleh setelah user menyetujui langkah dan tersedia backup/rollback.
- **Data sensitif**: Jangan simpan token, password, KTP, atau data pribadi asli di artifact. Redact secret di log dan laporan.
- **Production gate**: Jika target adalah produksi dan ada risiko outage/perubahan data, minta approval eksplisit sebelum aksi yang mengubah state.
- **Audit trail**: Setiap aksi tercatat di `hasil-test/ai/audit-log.jsonl` (waktu, target, tool, hasil, keputusan).

---

## 1. PRINSIP UTAMA: EXHAUSTIVE & GRANULAR TESTING (PENGUJIAN TANPA CELAH)

1. **100% Interactivity Coverage**:
   - **Semua Tombol Wajib Diklik**: Tombol primer, sekunder, tombol ikon kecil (+, -, edit, delete, view, download, export, import, print, close, cancel, refresh, collapse, expand).
   - **Semua Input Wajib Diuji**: Textbox, password, number, date picker, range month, dropdown single/multi select, radio button, checkbox, textarea, file upload.
   - **Semua Tab & Accordion Wajib Dibuka**: Setiap sub-tab dan hidden panel wajib dicek konten dan fungsinya.
2. **Uji Validasi Form & Keamanan (Security & Injection Probe)**:
   - Blank submission (klik submit saat form kosong, periksa apakah pesan error spesifik per field).
   - Boundary limits (karakter 0, 1, max, max+1, angka minus, desimal, format email tanpa domain/tanpa `@`, nomor telepon berisi teks).
   - Anti-duplikasi / primary key bentrok.
   - Masking & regex input constraint.
   - **Automated Security/Injection Probe**: Uji otomatis input payload XSS (`<script>alert(1)</script>`, `<img src=x onerror=alert(1)>`), SQL Injection (`' OR '1'='1`, `'; DROP TABLE--`), dan path traversal (`../../etc/passwd`) pada semua field input/search bar untuk memastikan aplikasi aman dari kerentanan input.
3. **Pengujian Tampilan, Visual Regression & UI/UX**:
   - **Visual Regression Testing (UI Diffing)**: Menyimpan snapshot baseline visual UI dan mendeteksi pergeseran layout, posisi tombol, ukuran elemen, atau font/warna yang rusak antar rilis.
   - Cek console error browser (HTTP 404 pada font, asset gambar pecah, file CSS/JS missing).
   - Tabrakan z-index / modal bertumpuk (backdrop overlay blocking).
   - Responsivitas tabel dan overflow horizontal/vertikal.
   - Konsistensi label vs placeholder vs format data.
4. **Performa & Network Latency Benchmark**:
   - **Automated API & Network Latency Benchmark**: Pantau durasi response time setiap route halaman dan request backend API (beri flag warning jika latency > 2.000 ms).
5. **Keamanan & Resiliensi Sistem (Destructive / Chaos)**:
   - Rapid multi-click / Race condition pada tombol aksi database (Save, Delete, Approve).
   - Manipulasi urutan tanggal (Date Inversion: Date To < Date From).
   - Broken session & privilege escalation (bypass role URL langsung).
6. **Data Lifecycle & Clean Teardown**:
   - **Automated Test Data Teardown/Cleanup**: Identifikasi data dummy/transaksi uji yang dibuat selama sesi testing dan lakukan automated cleanup/rollback agar database target tetap bersih.

---

## 2. DUKUNGAN INPUT PENGUJIAN (MULTI-MODE INGESTION)

Skill ini bekerja adaptif dalam **4 Skenario Input**:

| Mode | Input yang Disediakan User | Peran & Alur Kerja QA |
|---|---|---|
| **Mode 1: Script + FSD/PRD + URL** | Dokumen Spesifikasi + Test Script yang sudah ada + URL | Eksekusi script yang ada, validasi kesesuaian langkah terhadap FSD, tambah negative test case yang belum ter-cover di script, dan laporkan hasil uji. |
| **Mode 2: Spec-Driven (FSD / PRD / User Guide + URL)** | Dokumen spesifikasi + URL web live | Bedah aturan bisnis (business rules), buat test matrix lengkap (Happy & Negative), eksekusi di web, dan lakukan gap analysis (kesesuaian web vs dokumen). |
| **Mode 3: Whitebox (Source Code + URL)** | Folder project source code + URL web live | Analisis arsitektur kode, skema state/context, API endpoint, validasi form, dan eksekusi pengujian live. |
| **Mode 4: Pure Blackbox (Hanya URL Website)** | Hanya URL target (tanpa dokumen/code) | Eksplorasi UI/UX secara mandiri, identifikasi role, form, tombol, dan validasi fungsional menyeluruh. |
| **Mode 5: Mobile Binary (APK/IPA)** | File APK/IPA + akun uji + (opsional) source code | Instal di emulator/simulator/device uji, eksplorasi UI, statis + dinamis analysis, network inspection, dan pentest mobile sesuai bagian 3E. |
| **Mode 6: Network Scope** | Daftar IP/host/CIDR + izin tertulis | Mapping port/layanan, review TLS & konfigurasi, dan risk scoring jaringan sesuai bagian 3G. |

Untuk Mode 5 dan Mode 6, **guardrail bagian 0 wajib dipenuhi sebelum eksekusi**.

---

## 3. PROTOKOL EKSEKUSI MENYELURUH (WEB, ANDROID, iOS, API, & PENTEST)

### A. Protokol Khusus Aplikasi Mobile DCT (Asset, Cargo, CDC, FLM, dll):
- **Wajib Masuk ke Test Mode Terlebih Dahulu Sebelum Melakukan Login/Testing**:
  1. Pada halaman login awal aplikasi mobile DCT, klik ikon **titik 3** (di pojok kanan atas).
  2. Klik toggle/switch **Test Mode**.
  3. Masukkan PIN Test Mode: `789123` lalu klik **Submit**.
  4. Tekan tombol **Back** untuk kembali ke halaman login.
  5. Pastikan aplikasi berada dalam mode testing sebelum memasukkan kredensial login atau mengeksekusi skenario uji.

### B. Protokol Pengujian API Mobile & Backend (REST/JSON/HTTP):
1. **Ekstraksi Endpoint API**:
   - Analisis bytecode/decompiled DEX APK atau network inspection untuk mengambil Base URL, HTTP Method (GET/POST/PUT/DELETE), path route, query params, headers (misal: `Android-ID`, `Authorization`, `Content-Type`), dan payload schema.
2. **Validasi Request & Response Payload**:
   - Uji Happy Path: Verifikasi status code `200 OK` / `201 Created`, struktur JSON response, dan keakuratan data yang disimpan ke database.
   - Uji Negative & Boundary: Blank payload, invalid data type, missing required fields, boundary values -> pastikan response status `400 Bad Request` / `422 Unprocessable Entity` dengan error message yang informatif.
   - Uji Auth & Security: Request tanpa header token/auth (`401 Unauthorized`), request cross-role/privilege (`403 Forbidden`), SQL Injection & XSS payload injection probe pada field JSON.
3. **Network Latency & Performance Benchmark**:
   - Pantau response time API (flag jika latency > 2.000 ms).
   - Validasi error handling saat timeout / backend offline (tidak boleh return raw 500 stack trace ke client).

### C. Protokol Web & Playwright MCP:
Saat melakukan pengujian web, ikuti urutan perintah Playwright MCP berikut:

1. **Inisialisasi & Reset State**:
   ```javascript
   await page.goto(TARGET_URL);
   await page.evaluate(() => localStorage.clear());
   await page.reload();
   ```
2. **Snapshot & Element Discovery**:
   - Pindai seluruh tombol (`button, a, input[type="button"], input[type="submit"]`) dan input form pada halaman menggunakan `playwright_browser_evaluate` atau snapshot.
3. **Eksekusi Bertahap (Happy Path $\rightarrow$ Negative $\rightarrow$ Chaos / Edge Case)**:
   - Lakukan pengetesan satu per satu pada setiap elemen tanpa melewatkan tombol apa pun.
4. **Mandatori Screenshot pada Setiap Temuan Bug / Warning**:
   - Panggil `playwright_browser_take_screenshot(filename: "hasil-test/screenshots/<bug-id>.png")` segera saat error/anomali/state ditemukan.
5. **Cek Log Console & Network API**:
   - Panggil `playwright_browser_console_messages(level: "info")` untuk mencatat error HTTP 404, 500, atau JS exception.

### D. Protokol Otomasi iOS (Appium / XCUITest)
1. **Prasyarat**: macOS + Xcode (untuk simulator) atau real device dengan provisioning; Appium 2.x dengan driver `XCUITest`, atau XCTest/XCUITest native.
2. **Capabilities minimal**:
   ```json
   {
     "platformName": "iOS",
     "appium:automationName": "XCUITest",
     "appium:deviceName": "iPhone 15 Simulator",
     "appium:app": "/path/to/App.app",
     "appium:udid": "<simulator-or-device-udid>",
     "appium:noReset": false
   }
   ```
3. **Reset state**: uninstall/reinstall aplikasi, lalu reset permission dengan `xcrun simctl privacy <udid> reset all` (simulator) sebelum tiap skenario.
4. **Coverage wajib**: onboarding, login/logout, Face ID/Touch ID & fallback PIN, izin notifikasi/kamera/lokasi, deep link/universal link, foreground-background-foreground, keyboard & autocorrect, safe area/notch, dark mode, orientasi, dan lokalifikasi.
5. **Bukti**: screenshot per langkah ke `hasil-test/evidence/ios/`, log `xcrun simctl spawn booted log stream` atau Appium log ke `hasil-test/evidence/ios/device.log`.
6. **Script hasil**: `hasil-test/tests/ios/<app>.spec.ts` (Appium + WebdriverIO) atau `<App>UITests.swift` untuk XCUITest.

### E. Protokol Pentest Mobile (Android & iOS)
**Prasyarat: izin tertulis sesuai bagian 0.** Gunakan akun uji, bukan akun produksi.

1. **Static analysis**:
   - Android: dekompilasi APK dengan `apktool`/`jadx`; cek `AndroidManifest.xml` (exported activity/service/receiver/provider, intent-filter, permission), hardcoded secret/API key, certificate pinning, root detection, WebView JS bridge, `allowBackup`.
   - iOS: unpack IPA; cek `Info.plist` (`NSAppTransportSecurity`, `NSAppTransportSecurity` exceptions, URL scheme, `UIFileSharingEnabled`), hardcoded secret, jailbreak detection, Keychain/UserDefaults usage, ATS & certificate pinning.
   - Petakan temuan ke kategori **OWASP MASVS**: storage, crypto, auth, network, platform interaction, code quality, resiliency.
2. **Dynamic analysis**:
   - Storage: SharedPreferences/SQLite/Realm (Android), Keychain/UserDefaults/plist (iOS), Logcat/`log stream`, clipboard, screenshot task-switcher.
   - Network: intercept traffic via proxy hanya dengan consent; uji validasi TLS, certificate pinning, dan fallback HTTP plaintext.
   - Logic: deep link hijack, biometric bypass flow, role/parameter tampering pada request API, WebView bridge abuse.
3. **Output**: setiap temuan masuk `triage.json` dengan lokasi (komponen/field/file), risk score, dan bukti (`security/mobile/*.png|log`).

### F. Protokol Pentest Web (AI-Assisted)
**Prasyarat: scope URL tertulis sesuai bagian 0.**

1. **Recon ringan**: daftar endpoint dari crawling/sitemap, parameter, form, cookie, header respons.
2. **Probe deteksi-safe** (jangan destruktif):
   - Auth/session: akses tanpa token (`401`), cross-role dengan akun uji (`403`), session fixation, logout tidak invalidate token.
   - Injection probe: XSS/SQLi/path traversal/command-like payload non-destruktif pada semua input (lihat bagian 1.2).
   - CSRF token, CORS misconfiguration, security header (CSP, HSTS, X-Frame-Options, X-Content-Type-Options), cookie flag (`HttpOnly`, `Secure`, `SameSite`).
   - File upload (type/size/execution), directory listing, verbose error/stack trace, open redirect.
3. **Tooling**: Playwright MCP untuk probe UI, `curl`/HTTP client untuk header, OWASP ZAP baseline/active scan **hanya pada scope yang disetujui**.
4. **AI triage**: agent mengelompokkan duplikat, membuang false positive, memberi confidence level, dan menyusun remedasi. Temuan HIGH/CRITICAL wajib divalidasi manual.

### G. Protokol Pentest Jaringan (Authorized Only)
**Prasyarat: daftar IP/host/CIDR + izin tertulis sesuai bagian 0.**

1. **Passive/light recon**: DNS, identifikasi host hidup, banner/service version.
2. **Port & service mapping**: `nmap -sV --top-ports 1000 <scope>` (full port hanya jika disetujui); catat port/admin panel yang terekspos.
3. **TLS review**: versi & cipher (mis. `testssl.sh`/`sslyze`), expired/self-signed cert, HTTP→HTTPS redirect, HSTS.
4. **Konfigurasi**: firewall/ACL, SSH/Telnet/SNMP exposed, default credential **hanya di lab milik sendiri**, jangan brute-force produksi.
5. **Dilarang**: exploit aktif, DoS, pivot ke host di luar scope, atau password spraying tanpa approval tertulis.
6. **Output**: inventory `host:port:service` + risk score per host di `security/network/`.

### H. Lapisan Orkestrasi AI (Wajib untuk Challenge AI Engineer)
Gunakan LLM/agent sebagai **koordinator**, bukan pengganti bukti:

1. **Generate**: buat test matrix (happy/negative/chaos) dari FSD/PRD/user guide; untuk blackbox, generate hypotesis dari UI yang ditemukan.
2. **Execute assist**: sarankan langkah berikutnya, parameter boundary, dan payload probe yang aman sesuai bagian 0.
3. **Triage**: deduplikasi temuan, klasifikasi Functional Bug vs Security Risk vs Network Risk, hitung `Risk = Likelihood × Impact`, beri `confidence`.
4. **Explain**: terjemahkan temuan teknis ke dampak bisnis dan rekomendasi prioritas (short/medium/long term).
5. **Report**: susun ringkasan eksekutif + heatmap + top risks otomatis ke docx/markdown.
6. **Aturan emas**: AI **tidak boleh mengarang bukti**. Setiap risk harus punya path screenshot/log/request-response yang nyata dan entri di `ai/triage.json`.

---

## 4. STANDAR FORMAT TEMUAN BUG & ATRIBUT DEFECT REPORTING

Setiap bug/defect diklasifikasikan dengan tingkat keparahan (*Severity*):

- 🔴 **HIGH / CRITICAL**: Error sistem, crash backend 500, SQLi/XSS vulnerability, data loss, RBAC bypass, secret terekspos, atau layanan jaringan kritis terekspos publik.
- 🟡 **MEDIUM**: Validasi form lolos data invalid, duplikasi record, logic error (date inversion), multi-modal overlay crash, TLS/cookie/header misconfiguration, unhandled yellow screen.
- 🟢 **LOW / UX**: Link/tombol mati, asset font/gambar 404, typo teks, label misleading, kepadatan indikator mandatory.

**Risk scoring (wajib untuk temuan keamanan & pentest):**
- `Likelihood` 1-5 (1 = sulit dieksploitasi, 5 = sangat mudah) × `Impact` 1-5 (1 = minor, 5 = kritis) → `Risk = L × I` (rentang 1-25).
- Mapping: **20-25 = Critical**, **12-19 = High**, **6-11 = Medium**, **1-5 = Low**. Boleh ditambah CVSS v3.1 base score bila tersedia.
- Setiap risk wajib punya **lokasi eksplisit**: endpoint/URL, `host:port`, file kode, komponen APK/IPA, atau layar/elemen.
- `AI Confidence`: `high` / `medium` / `low`. Temuan Critical/High wajib divalidasi manual sebelum ditutup.

Format detail bug wajib mencantumkan screenshot visual:
```markdown
### [SEVERITY] [BUG-XX / RISK-XX]: [Judul Singkat]
- **Kategori:** Functional Bug | Security Risk | Network Risk
- **Lokasi / Halaman / Host:** [URL / endpoint / host:port / file / komponen APK/IPA / tab]
- **Likelihood (1-5) / Impact (1-5) / Risk Score:** [L] / [I] / [L×I]
- **CVSS (opsional):** [vektor + skor]
- **Langkah Reproduksi:**
  1. [Langkah 1]
  2. [Langkah 2]
- **Kondisi Aktual (Actual):** [Apa yang terjadi]
- **Kondisi Harapan (Expected):** [Apa yang seharusnya terjadi sesuai spesifikasi]
- **Dampak Bisnis:** [Contoh: kebocoran data pelanggan, takeover akun, downtime]
- **Rekomendasi Solusi Teknis:** [Saran perbaikan untuk developer/ops]
- **Bukti Visual/Log:** [path screenshot/log/request-response di hasil-test/...]
- **AI Confidence:** [high / medium / low]
```

---

## 5. GENERASI ARTIFAK OUTPUT PENGUJIAN

Di akhir pengujian, selalu hasilkan artifak-artifak berikut di folder `hasil-test/`:

### 1. Folder Bukti Screenshot Lengkap (`hasil-test/screenshots/*.png`)
Kumpulan bukti visual setiap temuan bug, breaking point, form error, dan baseline UI modul.

### 2. Script Otomasi Playwright Mandiri (`hasil-test/tests/<project-name>.spec.ts`)
Berisi test suite Playwright yang mencakup pengujian fungsional dan monkey stress suite.

### 3. CI/CD Pipeline Automation Template (`hasil-test/ci-cd/`)
Menghasilkan template pipeline workflow siap pakai:
- **GitHub Actions**: `hasil-test/ci-cd/playwright-e2e.yml`
- **GitLab CI**: `hasil-test/ci-cd/.gitlab-ci.yml`
- Mendukung eksekusi otomatis headless di cloud, artifact archiving untuk report html/docx, dan notification hook.

### 4. Integrasi Langsung ke Spreadsheet / Excel (.xlsx)
Jika pengguna meminta hasil pengujian diisi langsung ke file Excel/Spreadsheet (seperti `Enhancement Payroll WSS.xlsx`), lakukan langkah berikut:
1. **Analisis Struktur Kolom**: Identifikasi letak kolom `Result` (Status V/X), `Keterangan Tester`, `Keterangan PIC`, dan `Screenshot` (biasanya Kolom `Screenshot` / `I` / `H`).
2. **Populasi Nilai Uji Tanpa Mengubah Format**: Isi nilai `V` (Pass) atau `X` (Fail) dan update keterangan temuan pada baris skenario yang bersangkutan.
3. **Penyisipan Gambar Screenshot Otomatis pada Baris Defect/Temuan**:
   - Jika terdapat temuan ketidaksesuaian / defect (status `X`), tangkap screenshot bukti melalui Playwright.
   - Sisipkan file gambar langsung ke sel Excel pada kolom `Screenshot` menggunakan `openpyxl.drawing.image.Image` dengan penyesuaian dimensi gambar (lebar/tinggi sel).
   - Simpan workbook secara aman (tangani locked process/merged cells).

### 5. Dokumen Laporan Word Resmi Berisi Gambar Screenshot (`hasil-test/<NAMA_APLIKASI_ATAU_MODUL>_REPORT.docx`)
Dokumen Word disusun otomatis menggunakan library `python-docx` / `docx` dengan struktur penamaan file format: `hasil-test/<NAMA_APLIKASI/MODUL/WEB_YG_DITEST>_REPORT.docx` (contoh: `hasil-test/DCT_ANDROID_REPORT.docx`, `hasil-test/PAYROLL_WSS_REPORT.docx`):
1. **Halaman Judul & Meta Informasi** (Target URL, Tanggal, Scope, Status QA).
2. **Ringkasan Eksekutif & Metrik Kualitas** (Tabel Passed/Failed Rate, Breakdown Severity).
3. **Matriks Hasil Pengujian Detail** (Tabel komprehensif per elemen & skenario).
4. **Daftar Temuan Bug Terstruktur DILENGKAPI GAMBAR SCREENSHOT EMBEDDED**.
5. **Tangkapan Layar Baseline UI & Desain Modul**.
6. **Action Plan, Rekomendasi Arsitektur & Security Hardening**.
7. **Kesimpulan Kesiapan Rilis (Production Readiness)**.

### 6. Bukti Pentest & AI Triage (`hasil-test/security/` dan `hasil-test/ai/`)
- `security/mobile/`, `security/web/`, `security/network/`: log scan, request/response, screenshot, output ZAP/nmap, dan hasil static analysis.
- `ai/generated-cases.md`: test matrix otomatis dari FSD/PRD + negative/chaos cases.
- `ai/triage.json`: daftar temuan terstruktur berisi severity, risk score, lokasi, confidence, dan status validasi.
- `ai/audit-log.jsonl`: jejak eksekusi sesuai guardrail bagian 0.

### 7. Risk Register (`hasil-test/risk-register.xlsx`)
Kolom minimal: `ID`, `Kategori`, `Lokasi`, `Deskripsi`, `Likelihood`, `Impact`, `Risk Score`, `Severity`, `CVSS`, `Owner`, `Status`, `Due Date`, `Bukti`, `Catatan AI`.
Gunakan `openpyxl`, beri auto-filter dan conditional formatting/heatmap (hijau → kuning → merah).

### 8. Laporan Risiko Eksekutif (`hasil-test/<NAMA_TARGET>_RISK_REPORT.docx` atau `.md`)
Berisi: scope & izin, metode, metrik temuan per severity, **heatmap risiko**, top 5 risk beserta lokasi dan dampak bisnis, peta target (host/endpoint/modul), rekomendasi prioritas (short/medium/long term), dan kesimpulan **production readiness**. Setiap risk wajib menautkan bukti di `security/` dan entri di `ai/triage.json`.

---

## 6. TEMPLATE GENERATOR DOKUMEN WORD (.docx) BERGAMBAR

Gunakan Python (`python-docx`) untuk menyusun dokumen Word dengan gambar tertanam:

```python
import os
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

doc = Document()

# Iterasi setiap bug dan embed gambarnya
for bug in bugs:
    p = doc.add_paragraph()
    r = p.add_run(f"[{bug['severity']}] {bug['id']}: {bug['title']}\n")
    r.font.bold = True
    p.add_run(f"• Lokasi: {bug['location']}\n")
    p.add_run(f"• Deskripsi Masalah: {bug['desc']}\n")
    p.add_run(f"• Rekomendasi Solusi: {bug['recommendation']}\n")
    
    if os.path.exists(bug['img_path']):
        doc.add_picture(bug['img_path'], width=Inches(5.5))
        cap = doc.add_paragraph()
        cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_cap = cap.add_run(f"Gambar Bukti: {bug['id']} - {bug['title']}")
        r_cap.font.size = Pt(8.5)
        r_cap.font.italic = True

doc.save("hasil-test/<NAMA_APLIKASI/MODUL/WEB_YG_DITEST>_REPORT.docx")
```

Contoh ringkas menulis risk register dengan heatmap:

```python
from openpyxl import Workbook
from openpyxl.styles import PatternFill
from openpyxl.formatting.rule import CellIsRule

wb = Workbook()
ws = wb.active
ws.title = "Risk Register"
ws.append(["ID", "Lokasi", "Likelihood", "Impact", "Risk Score", "Severity", "Bukti"])

for risk in triage:
    score = risk["likelihood"] * risk["impact"]
    ws.append([
        risk["id"], risk["location"], risk["likelihood"], risk["impact"],
        score, risk["severity"], risk["evidence"],
    ])

ws.conditional_formatting.add(
    f"E2:E{ws.max_row}",
    CellIsRule(
        operator="greaterThanOrEqual",
        formula=["12"],
        fill=PatternFill("solid", fgColor="FFC7CE"),
    ),
)
wb.save("hasil-test/risk-register.xlsx")
```
