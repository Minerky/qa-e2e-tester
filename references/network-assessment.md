# Network Assessment (Mobile + Web + API)

## 0. Guardrail

UAT/staging only, izin tertulis, dilarang produksi, tidak mengirim notifikasi nyata, kredensial via env, redact NIK/token/chat_id/cookie, audit trail, stop saat UAT degradasi.

> `127.0.0.1:16384` adalah **ADB serial**, bukan alamat proxy. Dari dalam emulator, proxy ke host bisa lewat `adb reverse` → `127.0.0.1:8080` atau IP host (mis. `10.0.2.2`).

## 1. Inventaris Endpoint

Sumber: DEX/jadx, manifest, traffic MITM, Playwright network tab, OpenAPI/FSD.

```powershell
Get-ChildItem -Recurse -File out/jadx/sources | Select-String -Pattern 'https?://[A-Za-z0-9./?=_&%-]+' |
  ForEach-Object { $_.Matches.Value -replace '(token|chat_id|nik)=[^&\s]+','$1=[REDACTED]' } | Sort-Object -Unique
```

| ID | Method | Path | Host | Auth | Parameter | Sensitivitas | Bukti |
|---|---|---|---|---|---|---|---|
| EP-01 | GET | `/API/Problem` | `[REDACTED]` | header | `Kode=[REDACTED]` | Tinggi | flows.jsonl |
| EP-02 | POST | `/API/Master/AddDevice` | `[REDACTED]` | header | `userid=[REDACTED]` | Tinggi | flows.jsonl |

## 2. Proxy MITM & CA

```powershell
mitmdump --listen-host 127.0.0.1 --listen-port 8080 -s mitm_capture.py
adb reverse tcp:8080 tcp:8080
adb shell settings put global http_proxy 127.0.0.1:8080
adb shell settings put global https_proxy 127.0.0.1:8080
adb shell settings get global http_proxy
# selesai
adb shell settings put global http_proxy :0
adb shell settings put global https_proxy :0
adb reverse --remove tcp:8080
```

Pasang CA user:

```powershell
adb push mitmproxy-ca-cert.pem /sdcard/uat-ca.crt
adb shell am start -a android.intent.action.VIEW -d file:///sdcard/uat-ca.crt -t application/x-x509-ca-cert
```

CA sistem (root, hash lama):

```powershell
# hash = MD5(subject DER) 4 byte pertama dibalik → c8750f0d (contoh)
adb root
adb push mitmproxy-ca-cert.pem /system/etc/security/cacerts/<hash>.0
adb shell chmod 644 /system/etc/security/cacerts/<hash>.0
```

Jika `/system` read-only → user CA, patch copy UAT APK, atau Magisk. Verifikasi dengan melihat request masuk di proxy. Jika tidak ada, jangan klaim MITM berhasil.

## 3. TLS, Cipher, Sertifikat

```powershell
curl.exe -Iv --tlsv1.2 https://[REDACTED]/health
curl.exe -I --http2 https://[REDACTED]/
openssl s_client -connect [REDACTED]:443 -servername [REDACTED] -brief
```

| Item | Expected | Red flag |
|---|---|---|
| Protokol | TLS 1.2/1.3 | TLS 1.0/1.1 diterima |
| Cipher | AES-GCM/ChaCha20 | RC4/3DES/EXPORT |
| Sertifikat | SAN sesuai host | hostname mismatch |
| Redirect | HTTP → HTTPS | tetap HTTP |

## 4. Header Respons

```powershell
curl.exe -sS -D - -o NUL "$env:UAT_API/health" | Select-String -Pattern `
 '^(HTTP/|Strict-Transport-Security|Content-Security-Policy|Access-Control-Allow-Origin|Set-Cookie|X-Content-Type-Options|X-Frame-Options|Cache-Control|Server|X-Powered-By|Location)'
```

| Header | Expected |
|---|---|
| HSTS | `max-age>=31536000; includeSubDomains` |
| CSP | `default-src 'self'`, tanpa `unsafe-inline` |
| X-Content-Type-Options | `nosniff` |
| X-Frame-Options | `DENY`/`SAMEORIGIN` |
| Set-Cookie | `HttpOnly; Secure; SameSite=Lax` |
| ACAO | tidak merefleksikan origin asing |
| Server/X-Powered-By | disamarkan |

Probe CORS aman:

```powershell
curl.exe -sS -H "Origin: https://evil.example.invalid" -D - -o NUL "$env:UAT_API/v1/profile"
```

## 5. Token di URL & Cleartext

- Token wajib di `Authorization: Bearer`, bukan query string.
- `chat_id`, NIK, PIN, password tidak boleh muncul di URL/log/screenshot.
- Redaction otomatis di addon: parameter sensitif → `[REDACTED]`; sequence 10 digit → `[REDACTED]`.

Contoh temuan nyata sesi ini (sudah diredaksi):

```text
GET http://[REDACTED]/localandroid/API/Problem?Jenis=Progress&Kode=[REDACTED]&userid=[REDACTED] → 200, 133.609 byte, 79–114 ms
POST http://[REDACTED]/localandroid/API/Master/AddDevice?userid=[REDACTED]&AndroidName=DCTFLM → 200
```

## 6. Replay & Tampering

```powershell
curl.exe -sS -X GET "$env:UAT_API/v1/order/[REDACTED]" -H "Authorization: Bearer $env:QA_TOKEN_B" -D - -o NUL
curl.exe -sS -X PATCH "$env:UAT_API/v1/order/[REDACTED]" -H "Authorization: Bearer $env:QA_TOKEN" `
  -H 'Content-Type: application/json' --data '{"amount":-1,"status":"DUMMY_UAT"}' -D - -o NUL
```

Ekspektasi: 403/404, 400/409, bukan 200.

## 7. Resiliensi Jaringan

| Skenario | Cara | Ekspektasi |
|---|---|---|
| 2G/3G latency | mitmproxy addon `time.sleep(0.8)` | loading state, tidak freeze |
| Packet loss 2% | `tc netem loss 2%` | retry/backoff |
| DNS gagal | DNS `192.0.2.1` (TEST-NET-1) | error jelas, bukan stack trace |
| Offline | airplane mode | cached state, tidak crash |

```powershell
adb shell settings put global net.dns1 192.0.2.1
# uji, lalu kembalikan
adb shell settings put global net.dns1 8.8.8.8
adb shell settings put global airplane_mode_on 1
adb shell am broadcast -a android.intent.action.AIRPLANE_MODE --ez state true
# rollback
adb shell settings put global airplane_mode_on 0
adb shell am broadcast -a android.intent.action.AIRPLANE_MODE --ez state false
```

## 8. Latensi p95

```powershell
$samples = 1..20 | ForEach-Object {
  $raw = & $adb -s $serial shell am start -W -n "$pkg/.SplashActivity" 2>&1
  [int](($raw | Select-String 'TotalTime').ToString().Split(':')[-1].Trim())
}
$sorted = $samples | Sort-Object
$p95 = $sorted[[math]::Ceiling(0.95*$sorted.Count)-1]
```

Ambang: warning > 2.000 ms; stop > 3.000 ms bertahan.

> **Jebakan offline:** `settings put global airplane_mode_on 1` dapat membuat ADB TCP offline.
> Rollback lewat ADB lalu gagal. Fallback: `mumu-cli sh --vmindex 0 --cmd "settings put global
> airplane_mode_on 0"` + broadcast `AIRPLANE_MODE state false`, lalu set proxy `:0`, baru
> `mumu-cli adb --vmindex 0 --cmd connect`. Verifikasi `adb devices` kembali `device`.

## 9. Stop Condition & Rollback

5xx > 5%, p95 > 3.000 ms, crash/ANR, host di luar scope, notifikasi nyata, data sensitif tak teredaksi → **hentikan**.

```powershell
adb shell settings put global http_proxy :0
adb shell settings put global https_proxy :0
adb reverse --remove tcp:8080
adb shell settings put global net.dns1 8.8.8.8
adb shell am broadcast -a android.intent.action.AIRPLANE_MODE --ez state false
```
