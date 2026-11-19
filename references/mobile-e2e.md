# Mobile E2E (Android MuMu / ADB, opsional iOS)

> Helper **`qa_ui.py` dipromosikan sebagai jalur cepat eksplorasi Android saat emulator harus terlihat/live**. Pendamping — bukan pengganti — Appium/WDIO untuk otomasi penuh. Setiap langkah menghasilkan XML/screenshot/log; setiap temuan punya bukti.

## 0. Deteksi port MuMu dengan `mumu-cli`

Jangan hardcode `7555`. Port nyata bisa `16384`.

```powershell
$mumu = "$env:ProgramFiles\Netease\MuMuPlayer\nx_main\mumu-cli.exe"
$adbPort = ((& $mumu info --vmindex 0 | ConvertFrom-Json).adb_port)
$serial  = "127.0.0.1:$adbPort"
$adb     = "$env:ProgramFiles\Netease\MuMuPlayer\nx_main\adb.exe"

& $adb kill-server
& $adb start-server
& $adb connect $serial
& $adb devices
```

Status harus `device`. `unauthorized` → klik Allow di MuMu. `offline` → disconnect/connect ulang.

### Fallback saat ADB offline (mis. setelah airplane mode)

Skenario offline dapat membuat koneksi ADB TCP ke MuMu putus. Jika `adb connect` gagal tetapi
`mumu-cli` masih merespons, gunakan kanal shell MuMu untuk memulihkan state **sebelum** mencoba ADB lagi:

```powershell
$mumu = "$env:ProgramFiles\Netease\MuMuPlayer\nx_main\mumu-cli.exe"
& $mumu sh --vmindex 0 --cmd "settings get global airplane_mode_on"
& $mumu sh --vmindex 0 --cmd "settings put global airplane_mode_on 0"
& $mumu sh --vmindex 0 --cmd "am broadcast -a android.intent.action.AIRPLANE_MODE --ez state false"
& $mumu sh --vmindex 0 --cmd "settings put global http_proxy :0"
& $mumu sh --vmindex 0 --cmd "settings put global https_proxy :0"
& $mumu adb --vmindex 0 --cmd connect
```

Jika `is_process_started=false`, jalankan `mumu-cli control --vmindex 0 restart` lalu `... launch`.
Catat insiden dan keberhasilan rollback ke `ai/audit-log.jsonl`. **Jangan** mengklaim skenario offline
berhasil bila dump/screenshot gagal — tulis sebagai keterbatasan tooling.

## 1. Kontrak CLI `qa_ui.py`

Lokasi: `scripts/qa_ui.py`.

```powershell
python scripts/qa_ui.py --serial $serial devices
python scripts/qa_ui.py --serial $serial dump  --out hasil-test/evidence/android/ui_home.xml
python scripts/qa_ui.py --serial $serial tap   --text "Masuk"
python scripts/qa_ui.py --serial $serial tap   --x 540 --y 1200
python scripts/qa_ui.py --serial $serial text  --into "NIK" --value "[REDACTED]"
python scripts/qa_ui.py --serial $serial shot  --out hasil-test/evidence/android/BUG-01-home-001.png
python scripts/qa_ui.py --serial $serial activity
python scripts/qa_ui.py --serial $serial log   --out hasil-test/evidence/android/logcat.txt
```

| Perintah | Fungsi | Catatan |
|---|---|---|
| `devices` | verifikasi serial | `adb.exe` bawaan MuMu |
| `dump` | `uiautomator dump` + pull XML | sumber kebenaran otomasi |
| `tap --text` | cari `text`/`content-desc`, tap tengah | fallback ke koordinat |
| `tap --x --y` | koordinat absolut | dipakai bila XML kosong |
| `text --into --value` | focus field lalu `input text` | spasi → `%s` |
| `shot` | `screencap -p` + pull PNG | jangan pakai `>` PowerShell |
| `activity` | `dumpsys activity activities` | cek Activity aktif |
| `log` | `logcat -d -v time` | secret otomatis `[REDACTED]` |

## 2. Keterbatasan model: XML sebagai sumber kebenaran

Model/agent **tidak boleh mengklaim membaca screenshot**. Screenshot bukti untuk manusia; XML/log/response menjadi dasar keputusan.

```powershell
python -c "import xml.etree.ElementTree as E; r=E.parse('ui.xml').getroot(); print([(n.get('text'),n.get('bounds')) for n in r.iter('node') if n.get('text')])"
```

Jika XML hanya `<hierarchy .../>` tanpa node → kemungkinan WebView/Flutter/Canvas → fallback koordinat + Appium page source + screenshot manual.

## 3. Alur eksplorasi exhaustive

1. **Home:** dump → daftarkan semua `text`/`content-desc` → klik semua tombol termasuk ikon & overflow.
2. **Drawer:** buka hamburger → dump → buka tiap menu satu per satu, cek perubahan `activity`.
3. **Tab:** untuk tiap tab, dump, scroll sampai akhir, cek empty state, sticky header/footer, pagination.
4. **Detail:** buka item pertama **dan** terakhir; cek back stack & deep link.
5. **Form di detail:** negative, boundary, injection, rapid tap.
6. **Teardown:** logout, hapus data uji, hentikan `screenrecord`, simpan logcat.

```powershell
$seq = 0
foreach ($label in @('MAP','PROBLEM','OVERTICKET','PROFILE')) {
  $seq++
  python scripts/qa_ui.py --serial $serial dump --out "hasil-test/evidence/android/ui_$seq.xml"
  python scripts/qa_ui.py --serial $serial tap --text $label
  python scripts/qa_ui.py --serial $serial shot --out "hasil-test/evidence/android/tab_$seq.png"
  python scripts/qa_ui.py --serial $serial activity
}
```

## 4. Negative / injection / rapid tap

```powershell
# payload pada search/form
'<script>alert(1)</script>'
"' OR '1'='1"
'../../etc/passwd'

# rapid tap 5x
1..5 | ForEach-Object { python scripts/qa_ui.py --serial $serial tap --text 'Simpan' }
Start-Sleep -Milliseconds 800
python scripts/qa_ui.py --serial $serial dump --out hasil-test/evidence/android/rapid.xml
```

Ekspektasi: tidak ada duplikat, tombol disabled saat submit, tidak ada stack trace di logcat.

```powershell
# offline
& $adb -s $serial shell svc wifi disable
# jalankan skenario
& $adb -s $serial shell svc wifi enable
```

> Aplikasi DCT: masuk ke **Test Mode** dulu (PIN uji dari env/local file) sebelum login. Toggle Test Mode idempoten — jangan klik dua kali.

## 5. Screenshot & video sebagai bukti

```powershell
& $adb -s $serial shell screenrecord --time-limit 30 /sdcard/qa.mp4
& $adb -s $serial pull /sdcard/qa.mp4 hasil-test/evidence/android/qa.mp4
& $adb -s $serial shell screencap -p /sdcard/qa_shot.png
& $adb -s $serial pull /sdcard/qa_shot.png hasil-test/evidence/android/BUG-01-detail-003.png
python -c "p='hasil-test/evidence/android/BUG-01-detail-003.png'; print(open(p,'rb').read(8))"
# b'\x89PNG\r\n\x1a\n'
```

**Dilarang:** `& $adb ... screencap -p > shot.png` (merusak biner PNG).

## 6. Appium/WDIO & XCUITest

Template: `templates/android_mumu.spec.ts`, `wdio.conf.ts`, `wdio.ios.conf.ts`, `ios_xcuitest.spec.ts`, `package.json`.

```powershell
$env:JAVA_HOME='C:\Program Files\Eclipse Adoptium\jdk-21.0.13.9-hotspot'
$env:ANDROID_HOME="$env:LOCALAPPDATA\android-sdk-minimal"
$env:PATH="$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"
appium server --port 4723 --base-path /wd/hub
```

```powershell
$env:QA_NIK='[REDACTED]'
$env:QA_PASS='[REDACTED]'
$env:QA_UDID=$serial
$env:QA_TESTMODE_PIN='[REDACTED]'
npx wdio run wdio.conf.ts
```

iOS/XCUITest hanya divalidasi di macOS + Xcode. Mesin Windows menyiapkan template, tidak mengklaim tervalidasi.

## 7. Checklist serah terima

- [ ] Port ADB dari `mumu-cli`, bukan hardcode.
- [ ] XML tersedia untuk drawer, tiap tab, dan detail.
- [ ] Negative, injection, rapid tap dijalankan.
- [ ] Screenshot per temuan + video + logcat tersimpan.
- [ ] Logcat bebas stack trace/secret (`[REDACTED]`).
- [ ] Temuan masuk satu laporan gabungan.
