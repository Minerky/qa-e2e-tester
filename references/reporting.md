# Reporting — SATU Laporan Gabungan

> Prinsip utama: **satu file DOCX untuk semua disiplin**. Functional, security, network, dan performance tidak dipisah. ID temuan tunggal `F-### / N-### / P-### / S-###` dipakai lintas bab.

## 1. Struktur Bab Final

| Bab | Judul | Isi |
|---|---|---|
| 0 | Cover & Identitas | Proyek `[REDACTED]`, build `[REDACTED]`, tanggal, classifier, ref tiket |
| 1 | Ringkasan Eksekutif | Skor risiko, jumlah temuan per severity, 3 temuan teratas, verdict |
| 2 | Scope & RoE | Target, environment, teknik diizinkan, stop condition, nomor approval `[REDACTED]` |
| 3 | Metodologi | Functional, network, performance, security tools |
| 4 | Lingkungan | Perangkat/browser/build/getprop, MuMu `127.0.0.1:<port>` |
| 5 | Temuan Gabungan | Diurutkan severity → ID; lokasi, langkah, dampak, CVSS, rekomendasi, chain |
| 6 | Bukti Inline | Screenshot/log tepat di bawah temuan terkait, sudah diredaksi |
| 7 | Hasil Functional | Ringkasan kasus PASS/FAIL/BLOCKED |
| 8 | Hasil Network | Endpoint, status HTTP, header, TLS, observasi MITM, load test |
| 9 | Hasil Performance | Tabel metrik & gate |
| 10 | Risk Register | Tabel embedded satu register: ID, risiko, L, I, skor, owner, mitigasi |
| 11 | Rekomendasi P1/P2/P3 | Owner & target date |
| 12 | Batasan | Emulator vs fisik, area tak diuji, false negative |
| 13 | Lampiran Bukti | Inventaris path/type/caption/sha256/redacted |

Contoh ringkasan:

```text
Ditemukan 15 temuan: 1 critical, 3 high, 5 medium, 6 low. Temuan kritis
berada pada secret hardcoded di bytecode. Gate performa: cold median 454 ms
(PASS), janky 3,04% (PASS). Rekomendasi: tunda rilis sampai S-001 diverifikasi.
```

## 2. Skema `ai/triage.json`

```json
{
  "schemaVersion": "1.0.0",
  "project": "[REDACTED]",
  "environment": "UAT",
  "generatedAt": "2026-11-19T00:00:00+07:00",
  "findings": [{
    "id": "S-001", "title": "...", "discipline": "security",
    "severity": "P1", "status": "confirmed",
    "cvss": {"version":"3.1","vector":"CVSS:3.1/...","score":9.8},
    "cwe": "CWE-798", "location": "classes.dex",
    "steps": ["..."], "impact": "...", "recommendation": "...",
    "evidence": [{"path":"...","type":"log","caption":"...","sha256":"...","redacted":true}],
    "chain": ["N-002"], "owner": "[REDACTED]", "confidence": "high"
  }]
}
```

Validasi: `npx ajv-cli validate -s triage.schema.json -d triage.json --spec=draft2020`.

## 3. Redaction Helper

```python
import re
PATTERNS = [
  (r'-----BEGIN .*PRIVATE KEY-----.*?-----END .*PRIVATE KEY-----','[REDACTED_KEY]'),
  (r'\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b','[REDACTED_JWT]'),
  (r'(?i)\b(bearer|api[-_]?key|authorization|password|secret|token)\s*[:=]\s*[^\s,;"\']+', r'\1=[REDACTED]'),
  (r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b','[REDACTED_EMAIL]'),
  (r'\b(?:\+?62|0)8\d{8,11}\b','[REDACTED_PHONE]'),
  (r'(?i)(chat_id|nik|pin|kode|userid)=[^&\s]+', r'\1=[REDACTED]'),
  (r'(?<!\d)\d{10}(?!\d)','[REDACTED]'),
]
def redact(t):
    for rx,rep in PATTERNS: t = re.sub(rx,rep,t,flags=re.S)
    return t
```

Screenshot tidak bisa diredaksi otomatis — blur/crop area sensitif atau jangan lampirkan mentah.

## 4. Embed ke DOCX

```python
from docx import Document
from docx.shared import Inches, Pt
doc = Document()
doc.add_heading('Laporan Assessment — [REDACTED]', 0)
doc.add_heading('5. Temuan Gabungan', 1)
for f in findings:
    doc.add_heading(f"{f['id']} — {f['title']}", 2)
    doc.add_paragraph('Dampak: ' + f['impact'])
    for ev in f['evidence']:
        if ev['type']=='screenshot':
            doc.add_picture(ev['path'], width=Inches(5.8))
doc.save('Laporan-[REDACTED]-20261119.docx')
```

Gambar lebar `Inches(5.8)`; caption `keep_with_next` agar tidak terpisah halaman.

## 5. Penamaan & Aturan

```text
Laporan-[REDACTED]-v[REDACTED]-20261119.docx      <- satu-satunya laporan final
results/triage.json
evidence/S-001__secret__20261119-1605.png
evidence/N-002__idor__20261119-1445.har
evidence/P-003__cold-start__20261119-1500.json
evidence/raw/                                      <- tidak dilampirkan
```

- Pola: `<Prefix>-<NNN>__<slug>__<YYYYMMDD-HHmmss>.<ext>`.
- Satu source of truth: `ai/triage.json`; DOCX dan risk register turunan darinya.
- Folder hasil hanya berisi **satu DOCX**. Semua bukti, skrip, dan triage masuk satu subfolder `pendukung/` (atau `evidence/`), bukan file hasil tambahan.
- Risk register dan daftar test case **disisipkan ke dalam DOCX**, bukan file `.xlsx`/`.md` terpisah.
- Mode `e2e web`, `e2e mobile`, dan `e2e all` **tidak** membuat laporan per mode. Semua temuan dari kedua mode masuk satu `ai/triage.json` → satu DOCX.
- Target/kredensial di-auto-resolve dari perintah + dokumen pendukung; kredensial **tidak pernah** ditulis ke DOCX — yang dicantumkan adalah keputusan resolusinya (`[REDACTED]`).
- Laporkan status `PASS` / `FAIL` / `BLOCKED` per case. `BLOCKED` wajib dicantumkan di Bab Batasan dan tidak boleh dihitung sebagai `PASS`.
- **Jangan** membuat laporan terpisah per disiplin kecuali diminta eksplisit.
