---
name: qa-e2e-tester
description: Use when performing end-to-end (E2E) QA testing on web and mobile Android applications (via ADB, Appium, Playwright MCP), testing from FSD/PRD/User Guide/Test Scripts or pure URL/APK, handling DCT mobile apps with mandatory Test Mode (PIN 789123), generating automated test scripts (.spec.ts), and producing structured Word (.docx) / Markdown test reports with exhaustive validation and embedded screenshots.
---

# Universal QA E2E Testing & Reporting Skill (`qa-e2e-tester`)

Skill ini adalah standar operasional pengujian kualitas perangkat lunak (Software Quality Assurance) tingkat lanjut untuk **Web & Mobile Android Application** yang **WAJIB MENGEKSEKUSI PENGUJIAN SECARA TOTALITAS & EXHAUSTIVE (ZERO MISSED DEFECTS)**. Tidak boleh ada hal kecil, tombol, interaksi, atau validasi yang dilewatkan. Setiap komponen UI, modal, tab, filter, error dialog, input form, format data, boundary, dan permission harus diuji secara menyeluruh dengan **Playwright MCP / Android ADB** dan dilaporkan lengkap beserta bukti screenshot visual format Word (`.docx`).

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

---

## 3. PROTOKOL EKSEKUSI MENYELURUH DENGAN PLAYWRIGHT MCP & MOBILE ADB

### A. Protokol Khusus Aplikasi Mobile DCT (Asset, Cargo, CDC, FLM, dll):
- **Wajib Masuk ke Test Mode Terlebih Dahulu Sebelum Melakukan Login/Testing**:
  1. Pada halaman login awal aplikasi mobile DCT, klik ikon **titik 3** (di pojok kanan atas).
  2. Klik toggle/switch **Test Mode**.
  3. Masukkan PIN Test Mode: `789123` lalu klik **Submit**.
  4. Tekan tombol **Back** untuk kembali ke halaman login.
  5. Pastikan aplikasi berada dalam mode testing sebelum memasukkan kredensial login atau mengeksekusi skenario uji.

### B. Protokol Web & Playwright MCP:
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

---

## 4. STANDAR FORMAT TEMUAN BUG & ATRIBUT DEFECT REPORTING

Setiap bug/defect diklasifikasikan dengan tingkat keparahan (*Severity*):

- 🔴 **HIGH / CRITICAL**: Error sistem, crash backend 500, SQLi/XSS vulnerability, data loss, atau RBAC bypass.
- 🟡 **MEDIUM**: Validasi form lolos data invalid, duplikasi record, logic error (date inversion), multi-modal overlay crash, unhandled yellow screen.
- 🟢 **LOW / UX**: Link/tombol mati, asset font/gambar 404, typo teks, label misleading, kepadatan indikator mandatory.

Format detail bug wajib mencantumkan screenshot visual:
```markdown
### [SEVERITY] BUG-XX: [Judul Singkat Bug]
- **Lokasi / Halaman:** [Nama komponen / URL / Tab]
- **Langkah Reproduksi:** 
  1. [Langkah 1]
  2. [Langkah 2]
- **Kondisi Aktual (Actual):** [Apa yang terjadi]
- **Kondisi Harapan (Expected):** [Apa yang seharusnya terjadi sesuai spesifikasi]
- **Rekomendasi Solusi Teknis:** [Saran perbaikan untuk developer]
- **Bukti Visual (Screenshot):** [Gambar tersimpan di hasil-test/screenshots/ dan embedded di docx]
```

---

## 5. GENERASI ARTIFAK OUTPUT PENGUJIAN

Di akhir pengujian, selalu hasilkan **3 Artifak Utama** di folder `hasil-test/`:

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

### 5. Dokumen Laporan Word Resmi Berisi Gambar Screenshot (`hasil-test/QA_TEST_REPORT.docx`)
Dokumen Word disusun otomatis menggunakan library `python-docx` / `docx` dengan struktur:
1. **Halaman Judul & Meta Informasi** (Target URL, Tanggal, Scope, Status QA).
2. **Ringkasan Eksekutif & Metrik Kualitas** (Tabel Passed/Failed Rate, Breakdown Severity).
3. **Matriks Hasil Pengujian Detail** (Tabel komprehensif per elemen & skenario).
4. **Daftar Temuan Bug Terstruktur DILENGKAPI GAMBAR SCREENSHOT EMBEDDED**.
5. **Tangkapan Layar Baseline UI & Desain Modul**.
6. **Action Plan, Rekomendasi Arsitektur & Security Hardening**.
7. **Kesimpulan Kesiapan Rilis (Production Readiness)**.

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

doc.save("hasil-test/QA_TEST_REPORT.docx")
```
