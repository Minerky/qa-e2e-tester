# Panduan Instalasi Skill `qa-e2e-tester` di Laptop / Komputer Baru

Panduan ini digunakan untuk memasang skill **`qa-e2e-tester`** pada instalasi OpenCode di laptop baru.

---

## 1. Prasyarat Sistem
Pastikan perangkat baru sudah terpasang:
- **Git**: [Download Git](https://git-scm.com/)
- **Python 3.10+**: [Download Python](https://www.python.org/)
- **OpenCode CLI**: Terpasang dan dapat dijalankan.

---

## 2. Langkah Instalasi Skill

### Windows (PowerShell)
Buka PowerShell dan jalankan perintah berikut:

```powershell
# 1. Pastikan folder direktori skills ada
New-Item -ItemType Directory -Force -Path "$HOME\.config\opencode\skills"

# 2. Clone repository skill ke folder konfigurasi OpenCode
git clone https://github.com/Minerky/qa-e2e-tester.git "$HOME\.config\opencode\skills\qa-e2e-tester"

# 3. Install dependency Python yang dibutuhkan untuk testing & pelaporan
python -m pip install playwright openpyxl python-docx pillow

# 4. Install browser Chromium untuk Playwright
python -m playwright install chromium
```

---

### macOS / Linux (Terminal)
Buka Terminal dan jalankan:

```bash
# 1. Pastikan folder direktori skills ada
mkdir -p "$HOME/.config/opencode/skills"

# 2. Clone repository skill
git clone https://github.com/Minerky/qa-e2e-tester.git "$HOME/.config/opencode/skills/qa-e2e-tester"

# 3. Install dependency Python
pip3 install playwright openpyxl python-docx pillow

# 4. Install browser Chromium
playwright install chromium
```

---

## 3. Verifikasi Pemasangan

1. Buka OpenCode di terminal mana saja:
   ```bash
   opencode
   ```
2. Skill `qa-e2e-tester` akan langsung terdeteksi otomatis pada sistem OpenCode.
3. Anda bisa langsung memberikan instruksi seperti:
   - *"Jalankan testing E2E untuk web https://... berdasarkan file FSD / test script Excel."*
   - *"Lakukan QA testing pada modul login dan catat hasilnya ke Excel."*

---

## 4. Cara Update Skill ke Versi Terbaru
Jika ada pembaruan di repository GitHub:

```bash
cd ~/.config/opencode/skills/qa-e2e-tester
git pull origin main
```
