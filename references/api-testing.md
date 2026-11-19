# API Testing (REST/JSON)

> Guardrail: hanya UAT/staging dengan izin tertulis. Base URL, token, NIK, password ditulis `[REDACTED]`.

## 0. Variabel & alat

```powershell
$env:API_BASE = 'https://[REDACTED]/api/v1'
$env:QA_TOKEN = '[REDACTED]'
$env:QA_TOKEN_B = '[REDACTED]'
Get-Command curl.exe,k6 -ErrorAction SilentlyContinue | Select-Object Name,Source
```

Gunakan `curl.exe` eksplisit di Windows (alias PowerShell berbeda).

## 1. Contract & schema

Sumber kebenaran: OpenAPI / FSD. Validasi status, `Content-Type`, field wajib, tipe, format, enum, nullable.

```powershell
curl.exe -sS "$env:API_BASE/orders/QA-1" -H "Authorization: Bearer $env:QA_TOKEN" |
  ConvertFrom-Json | Select-Object id,kode,status,createdAt
```

## 2. Auth & session

| Kasus | Ekspektasi |
|---|---|
| Tanpa token | 401 + `WWW-Authenticate` |
| Token expired / malformed | 401, bukan 500 |
| Logout invalidate | token lama → 401 |
| Refresh rotation | refresh token dipakai 2× → 401 |
| Session fixation | cookie session berganti setelah login |

```powershell
curl.exe -sS -D - -o NUL "$env:API_BASE/auth/login" -H 'Content-Type: application/json' `
  --data '{"nik":"[REDACTED]","password":"[REDACTED]"}'
```

## 3. Positive / negative / boundary

- Positive: 201 + `Location` + terverifikasi lewat GET.
- Negative: `{}` → 400/422; tipe salah → 422.
- Boundary: 0/1/50/51 char; `-1/0/max`; `page=0`; `limit=0/101`; date inversion.
- Idempotency: `Idempotency-Key` sama 2× → tetap 1 record.

## 4. Fuzz aman

Payload deteksi-safe:

```text
<script>alert(1)</script>
' OR '1'='1
../../etc/passwd
{{7*7}}
😀
A × 10.000
1e309 / NaN / null / []
```

```js
check(r, {
  'tidak 5xx': x => x.status < 500,
  'script tidak reflected': x => !x.body.includes('<script>alert(1)</script>'),
  'latency < 2s': x => x.timings.duration < 2000,
});
```

## 5. Authz / IDOR

Buat 2 akun uji A & B. Record milik A diakses token B → 403/404, bukan 200.

- Ganti `id`, `userId`, `tenantId` di path/query/body.
- Mass assignment: `"role":"admin"` → diabaikan/422.
- Vertical escalation: viewer mengakses endpoint admin.

## 6. Rate limit & replay

```powershell
1..25 | ForEach-Object { curl.exe -sS -o NUL -w "%{http_code} " "$env:API_BASE/orders" -H "Authorization: Bearer $env:QA_TOKEN" }
```

- Replay tanpa idempotency → duplikat = temuan.
- Replay setelah logout → 401.
- Ubah 1 karakter signature/timestamp → 400/401.

## 7. Response manipulation

Client harus bertahan saat `500` + HTML stack, `200` + `null`, `[]`, field hilang, tipe berubah, latency 10 detik. Simulasikan via `page.route` atau proxy mock. Ekspektasi: error generik, retry backoff, spinner tidak abadi.

## 8. Latency & beban ringan

```js
export const options = {
  stages: [{duration:'30s',target:10},{duration:'1m',target:20},{duration:'30s',target:0}],
  thresholds: { http_req_duration:['p(95)<2000'], http_req_failed:['rate<0.01'] },
};
```

Flag bila p95 > 2.000 ms; stop bila error rate > 5%.

## 9. Template kasus uji

| ID | Endpoint | Kasus | Ekspektasi | Status | Bukti |
|---|---|---|---|---|---|
| API-01 | `/auth/login` | Happy | 200 + cookie HttpOnly | | |
| API-02 | `/auth/login` | Blank | 422 per field | | |
| API-03 | `/orders/{id}` | IDOR token B | 403/404 | | |
| API-04 | `/search` | Fuzz XSS | tidak reflected | | |
| API-05 | `/orders` | Boundary 51 | 422 | | |
| API-06 | `/orders` | Replay | 1 record/409 | | |
| API-07 | `/orders` | Rate limit | 429 + Retry-After | | |
| API-08 | `/orders` | p95 20 VU | < 2000 ms | | |

Semua temuan masuk satu laporan gabungan + `ai/triage.json`.
