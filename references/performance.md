# Performance & Stability

> Semua angka harus reproducible. Setiap metrik punya gate PASS/WARN/FAIL. Hasil emulator MuMu adalah **baseline relatif**, bukan angka perangkat fisik.

## 0. Prasyarat

```powershell
$adb="C:\Program Files\Netease\MuMuPlayer\nx_main\adb.exe"; $serial="127.0.0.1:16384"
$PKG="com.[REDACTED].app"; $ACT="$PKG/.MainActivity"
$OUT="evidence\perf\$(Get-Date -Format yyyyMMdd-HHmmss)"
New-Item -ItemType Directory -Force -Path $OUT | Out-Null
& $adb shell getprop ro.build.version.release
& $adb shell wm size
& $adb shell wm density
```

Kondisi sama saat membandingkan: brightness, mode daya, jaringan, build/commit, cold-boot sekali.

## 1. Cold / Warm Start

```powershell
function StartTime([switch]$Cold) {
  if ($Cold) { & $adb -s $serial shell am force-stop $PKG; Start-Sleep -Milliseconds 800
               $raw = & $adb -s $serial shell am start -W -S $ACT 2>&1 }
  else { $raw = & $adb -s $serial shell am start -W $ACT 2>&1 }
  if (($raw -join "`n") -match 'TotalTime:\s*(\d+)') { return [int]$Matches[1] }
}
$cold = 1..10 | ForEach-Object { StartTime -Cold }
Start-Sleep -Seconds 3
$warm = 1..10 | ForEach-Object { StartTime; Start-Sleep -Milliseconds 500 }
```

Hitung median & p95. Buang iterasi pertama hanya jika ada first-run/onboarding, dan **catat alasannya**.

> Catatan: `am start -W` saat Activity masih foreground bisa mengembalikan `TotalTime: 0` — itu artefak pengukuran, bukan warm-start nyata. Untuk warm-start, HOME dulu sebelum start.

## 2. Jank / Frame Time

```powershell
& $adb shell setprop debug.hwui.profile visual_bars
& $adb shell dumpsys gfxinfo $PKG reset
# jalankan skenario 30 detik (scroll/gallery/map)
& $adb shell dumpsys gfxinfo $PKG | Out-File "$OUT\gfxinfo.txt"
Select-String "$OUT\gfxinfo.txt" -Pattern 'Janky|95th|Missed VSync|High Input'
```

Perfetto (opsional): push config, rekam 15 detik, buka di `ui.perfetto.dev`, cek `FrameTimeline`.

## 3. Resource

```powershell
& $adb shell dumpsys meminfo $PKG | Out-File "$OUT\meminfo.txt"
& $adb shell dumpsys cpuinfo | Select-String $PKG
& $adb shell dumpsys netstats | Out-File "$OUT\netstats.txt"
& $adb shell dumpsys batterystats --charged | Out-File "$OUT\batterystats.txt"
```

Laporkan: PSS median/puncak, growth soak, CPU idle vs skenario, baterai/30 menit, KB received+sent.

## 4. Stabilitas

```powershell
# smoke 1000 event (seed tetap)
& $adb shell monkey -p $PKG -s 20261119 --throttle 50 --pct-syskeys 0 `
  --pct-appswitch 0 --ignore-crashes --ignore-timeouts -v 1000 2>&1 |
  Tee-Object "$OUT\monkey-1000.txt"
& $adb shell pidof $PKG
```

- Rapid tap 20× pada tombol sama → cek duplikat submit.
- Background/foreground: HOME 15 detik → start ulang → cek state.
- Process death: `kill -9 <pid>` → start ulang → cek restore.
- Soak: loop 60 detik catat PSS/CPU; growth > 25% = FAIL.

> Monkey dapat menyentuh tombol state-changing. Batasi event, pakai `-p`, dan pastikan environment UAT.

## 5. Web Performance

```powershell
npx lighthouse https://[REDACTED] --only-categories=performance `
  --output=json --output=html --output-path="$OUT\lighthouse" `
  --chrome-flags="--headless --no-sandbox" --quiet
```

Metrik: LCP ≤ 2,5 s; CLS ≤ 0,1; TBT ≤ 350 ms (proksi lab INP); FCP; TTFB ≤ 800 ms; bundle JS gzip ≤ 200 KB.

```powershell
curl.exe -o NUL -s -w "ttfb=%{time_starttransfer}s total=%{time_total}s code=%{http_code}`n" https://[REDACTED]/health
```

## 6. Load Test k6 (ringan, UAT)

```js
export const options = {
  stages: [{duration:'2m',target:20},{duration:'3m',target:50},
           {duration:'5m',target:50},{duration:'1m',target:0}],
  thresholds: { http_req_failed:[{threshold:'rate<0.05',abortOnFail:true}],
                http_req_duration:['p(95)<2000'] },
};
```

Stop bila error rate > 5%, p95 > 3.000 ms, atau UAT degradasi.

## 7. Tabel Gate

| Metrik | Good | Warn | Fail |
|---|---|---|---|
| Cold median | ≤ 2.000 ms | 2.000–3.500 | > 3.500 |
| Cold p95 | ≤ 3.000 ms | 3.000–5.000 | > 5.000 |
| Frame p95 | ≤ 16,7 ms | 16,7–33 | > 33 |
| Janky frames | ≤ 5% | 5–10% | > 10% |
| PSS median | ≤ 150 MB | 150–250 | > 250 |
| PSS growth soak | ≤ 10% | 10–25% | > 25% |
| CPU idle | ≤ 2% | 2–8% | > 8% |
| Crash monkey 5k | 0 | 1 | ≥ 2 |
| LCP | ≤ 2,5 s | 2,5–4 | > 4 |
| CLS | ≤ 0,1 | 0,1–0,25 | > 0,25 |
| TTFB | ≤ 800 ms | 800–1.800 | > 1.800 |
| Error rate k6 | < 1% | 1–5% | > 5% (abort) |

## 8. Cara Mencatat

1. Simpan mentah dulu (`*.txt`, `*.json`), baru ringkasan.
2. Satu baris = satu metrik: `Metrik | Nilai | Satuan | Threshold | Status | Tool | Path bukti | Waktu`.
3. Cantumkan build, perangkat, seed monkey, VU puncak, jendela waktu, `environment=emulator`.
4. Status FAIL → temuan `P-###` di triage dengan bukti.
5. Jangan simpan token mentah di log performa.
