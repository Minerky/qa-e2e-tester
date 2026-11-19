# Intake & Rules of Engagement (RoE)

> **Gate awal: jangan jalankan satu pun perintah pengujian sebelum questionnaire lengkap dan Rules of Engagement disetujui tertulis oleh owner sistem.** Checklist ini mencegah pengujian masuk ke environment yang salah atau teknik yang tidak diizinkan.

## 1. Questionnaire Authorization & Scope

| No | Pertanyaan | Wajib | Jawaban | Validasi |
|---|---|---|---|---|
| 1 | Nama proyek / aplikasi & fungsinya | Ya | `[REDACTED]` | Cocok dengan daftar target |
| 2 | Versi build, commit, tanggal deploy | Ya | `[REDACTED]` | `git rev-parse --short HEAD` |
| 3 | Environment yang diizinkan (UAT / staging / perf / prod) | Ya | `UAT + staging` | Prod butuh approval eksplisit terpisah |
| 4 | Host / IP / base URL target | Ya | `[REDACTED]` | Hanya host terdaftar di Bagian 5 |
| 5 | Platform (Android / iOS / web / API) | Ya | `Android + Web + API` | Menentukan tooling |
| 6 | Tujuan pengujian (regresi / keamanan / performa / kombinasi) | Ya | `Kombinasi` | Menentukan disiplin laporan |
| 7 | Teknik diizinkan (MITM+CA / root+Frida / load test / scanning) | Ya | Lihat Bagian 3 | Centang eksplisit, tidak boleh ambigu |
| 8 | Akun uji & role (user, admin, tenant lain) | Ya | `[REDACTED]` | Diberikan owner, bukan akun karyawan |
| 9 | Jenis data uji (synthetic / production yang diredaksi) | Ya | `Synthetic` | Jika production → redaction wajib |
| 10 | Jendela waktu & zona waktu | Ya | `[REDACTED]` | Tidak bentrok rilis / maintenance |
| 11 | Stop condition disetujui | Ya | Lihat Bagian 6 | Nomor kontak darurat aktif |
| 12 | Nama & kontak owner sistem + owner aplikasi | Ya | `[REDACTED]` | Bisa dihubungi selama sesi |
| 13 | Perlakuan temuan kritis (eskalasi ≤ 1 jam?) | Ya | `Ya` | Kanal eskalasi disepakati |
| 14 | Retensi & penghapusan artefak (mis. 30 hari) | Ya | `30 hari` | Termasuk `evidence/raw/` |
| 15 | Nomor tiket / persetujuan tertulis | Ya | `[REDACTED]` | Lampirkan email/approval |

## 2. Environment UAT / Staging

| Environment | Base URL / Host | Versi | Data | Akses | Catatan |
|---|---|---|---|---|---|
| UAT | `https://[REDACTED].uat.internal` | `[REDACTED]` | Synthetic | VPN + akun uji | Functional & exploratory |
| Staging | `https://[REDACTED].staging.internal` | `[REDACTED]` | Synthetic + mirror | VPN + CA proxy | Security & network |
| Perf | `https://[REDACTED].perf.internal` | `[REDACTED]` | Synthetic | Dedicated | k6 20→50 VU |
| Produksi | `https://[REDACTED].internal` | `[REDACTED]` | Real | **Read-only, approval eksplisit** | Dilarang load test / destruktif |
| Emulator | `127.0.0.1:<adb_port>` (MuMu) | Android `[REDACTED]` | Synthetic | Lokal | Port dari `mumu-cli`, bukan hardcode |

- Semua teknik aktif (MITM, root, Frida, monkey, k6) hanya di UAT/staging/perf.
- Produksi hanya observasi pasif; tidak ada POST/PUT/DELETE uji.
- Jika staging belum tersedia, tulis `BLOCKED` — jangan fallback ke produksi.

## 3. Teknik Diizinkan

| Teknik | Status | Syarat | Alat |
|---|---|---|---|
| Exploratory / functional manual | Diizinkan | Akun uji dari owner | Browser, MuMu, `adb` |
| MITM + install CA | Diizinkan (UAT/staging) | CA hanya di perangkat uji, proxy hanya host target | Burp / mitmproxy |
| Root + Frida | Diizinkan (perangkat uji) | Perangkat khusus, bukan pribadi | `frida-server`, `objection` |
| Static analysis (APK/IPA) | Diizinkan | Build resmi | `jadx`, `androguard`, `apktool` |
| Port / service scan | Terbatas | Host terdaftar, port disepakati | `nmap -sT --top-ports 100` |
| Load test k6 20→50 VU | Diizinkan | Environment perf, low-peak, stop error > 5% | `k6` |
| Monkey / soak / kill process | Diizinkan | Emulator/perangkat uji, `-p <package>` wajib | `adb shell monkey` |
| Uji destruktif | Terbatas | Data synthetic + backup + konfirmasi owner | — |
| DoS / DDoS | **Dilarang** | — | — |
| Social engineering / phishing | **Dilarang** | — | — |
| Modifikasi data produksi | **Dilarang** | — | — |

```powershell
adb connect 127.0.0.1:16384
adb shell monkey -p com.[REDACTED].app -s 20261119 -v 5000
mitmdump --set upstream_cert=false --listen-port 8080
adb shell settings put global http_proxy 127.0.0.1:8080
# selesai
adb shell settings put global http_proxy :0
```

## 4. Kredensial Uji via Env Var / Local File

Jangan menaruh kredensial di skrip, laporan, log, atau git.

```powershell
$env:QA_BASE_URL = "https://[REDACTED].staging.internal"
$env:QA_USER     = "[REDACTED]"
$env:QA_PASS     = "[REDACTED]"
$env:QA_OTP_SEED = "[REDACTED]"
$env:QA_TOKEN    = "[REDACTED]"
```

File lokal `.env.qa` (wajib masuk `.gitignore`):

```dotenv
QA_BASE_URL=https://[REDACTED].staging.internal
QA_USER=[REDACTED]
QA_PASS=[REDACTED]
QA_TENANT=[REDACTED]
QA_OTP_SEED=[REDACTED]
```

```powershell
Get-Content .env.qa | ForEach-Object {
  if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
    Set-Item -Path "env:$($Matches[1])" -Value $Matches[2]
  }
}
```

```gitignore
.env.qa
.env.*
evidence/raw/
evidence/**/*.raw.*
results/triage.raw.json
*k6-raw.json
```

## 5. Daftar Target

| ID | Aset | URL / IP | Environment | Owner | Teknik Diizinkan |
|---|---|---|---|---|---|
| T-01 | Mobile app | `com.[REDACTED].app` @ MuMu | UAT | `[REDACTED]` | Functional, monkey, Frida, MITM |
| T-02 | Web app | `https://[REDACTED].uat.internal` | UAT | `[REDACTED]` | Functional, Lighthouse |
| T-03 | API gateway | `https://[REDACTED].staging.internal` | Staging | `[REDACTED]` | MITM, curl, k6 read-only |
| T-04 | Auth service | `https://[REDACTED].staging.internal/oauth` | Staging | `[REDACTED]` | MITM, JWT analysis |

> Apa pun yang tidak ada di tabel = di luar scope. Jika muncul host baru (redirect/subdomain/third-party), catat sebagai observasi dan tanyakan owner.

## 6. Stop Condition

| # | Kondisi | Ambang | Aksi |
|---|---|---|---|
| 1 | Error rate k6 | > 5% | Hentikan load test, eskalasi owner infra |
| 2 | Latency p95 endpoint kritis | > 3.000 ms | Tandai FAIL, lanjut read-only |
| 3 | Crash aplikasi | ≥ 2 dalam 5.000 event monkey | Hentikan monkey, kumpulkan tombstone |
| 4 | ANR | ≥ 1 | Hentikan sesi, eskalasi P2 |
| 5 | UI freeze | > 5 detik | Hentikan skenario, screenshot |
| 6 | Risiko korupsi data | Terdeteksi | Hentikan semua teknik tulis |
| 7 | Akses produksi tanpa izin | Terjadi | Hentikan, laporkan ≤ 1 jam |
| 8 | Kredensial terekam mentah | Terjadi | Hapus artefak, redaksi, rotasi |
| 9 | Keluar dari daftar target | Terjadi | Hentikan, minta perluasan RoE |
| 10 | Gangguan pengguna nyata | Terlapor | Hentikan, koordinasi insiden |

## 7. Kontak Owner & Eskalasi

| Peran | Nama | Kontak | Kanal |
|---|---|---|---|
| Owner sistem | `[REDACTED]` | `[REDACTED]` | `[REDACTED]` |
| Owner aplikasi | `[REDACTED]` | `[REDACTED]` | `[REDACTED]` |
| Owner infra | `[REDACTED]` | `[REDACTED]` | `[REDACTED]` |
| Security contact | `[REDACTED]` | `[REDACTED]` | `[REDACTED]` |
| QA lead | `[REDACTED]` | `[REDACTED]` | `[REDACTED]` |

Minimal satu kontak harus aktif selama jendela pengujian. Jika tidak ada, jangan mulai.

## 8. Checklist Legal

```text
- [ ] Persetujuan tertulis dari owner sistem (nomor tiket: [REDACTED])
- [ ] Scope target tertulis dan cocok dengan Bagian 5
- [ ] Environment bukan produksi (atau produksi dengan approval eksplisit)
- [ ] Akun uji diberikan owner, bukan akun pribadi karyawan
- [ ] Data uji synthetic / sudah diredaksi
- [ ] Jendela waktu disepakati
- [ ] Stop condition disetujui dan kontak darurat terverifikasi
- [ ] CA proxy hanya dipasang di perangkat uji, dicopot setelah selesai
- [ ] Root/Frida hanya di perangkat uji
- [ ] Tidak ada DoS/DDoS, social engineering, modifikasi data produksi
- [ ] Retensi artefak disepakati (mis. 30 hari)
- [ ] Kanal eskalasi temuan kritis ≤ 1 jam telah dikonfirmasi
- [ ] Redaction helper dijalankan sebelum laporan dibagikan
- [ ] RoE disetujui kedua pihak
```

## 9. Template RoE Singkat

```markdown
# Rules of Engagement — [REDACTED]
Versi: 1.0 | Tanggal: [REDACTED] | Ref tiket: [REDACTED]

## 1. Pihak
- Owner sistem: [REDACTED]
- Tim penguji: [REDACTED]
- Koordinator: [REDACTED]

## 2. Waktu
- Mulai / selesai: [REDACTED]
- Zona waktu: [REDACTED]

## 3. Target
- T-01 … T-04; host di luar daftar = di luar scope.

## 4. Teknik Diizinkan
Functional, MITM+CA, root+Frida, static analysis, monkey/soak, k6 20→50 VU, Lighthouse.

## 5. Dilarang
DoS/DDoS, social engineering, modifikasi data produksi, host di luar scope.

## 6. Stop Condition
Error rate k6 > 5%; crash ≥ 2/5.000 event; ANR ≥ 1; freeze > 5 s;
korupsi data; akses produksi tanpa izin; kredensial terekam mentah.

## 7. Penutupan
CA dicopot, proxy `:0`, akun uji dinonaktifkan, artefak diarsipkan/dihapus.

## 8. Persetujuan
| Peran | Nama | Tanda tangan | Tanggal |
|---|---|---|---|
| Owner sistem | [REDACTED] | [REDACTED] | [REDACTED] |
| QA lead | [REDACTED] | [REDACTED] | [REDACTED] |
```
