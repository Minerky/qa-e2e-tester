// Template iOS XCUITest — qa-e2e-tester
// STATUS: BELUM DIEKSEKUSI di mesin referensi (Windows). Butuh macOS + Xcode +
// Appium driver `xcuitest` + simulator/real device. Seluruh selector di bawah
// bersifat contoh dan WAJIB disesuaikan dengan accessibility identifier aplikasi.
//
// Jalankan di macOS:
//   appium driver install xcuitest
//   appium server --port 4723 --base-path /wd/hub
//   QA_BUNDLE_ID=com.example.app QA_UDID=<sim-udid> npx wdio run wdio.ios.conf.ts

const BUNDLE_ID = process.env.QA_BUNDLE_ID || '';

describe('iOS smoke (template)', () => {
  before(function () {
    if (!BUNDLE_ID) {
      throw new Error('Set QA_BUNDLE_ID dulu (bundle identifier aplikasi).');
    }
  });

  it('launch aplikasi dan verifikasi layar awal', async () => {
    expect(await driver.isAppInstalled(BUNDLE_ID)).toBe(true);
    await driver.activateApp(BUNDLE_ID);
    await driver.pause(3000);

    // Ganti ke accessibility id / predicate yang benar-benar ada di aplikasi.
    const layarAwal = await driver.$('~home-screen');
    expect(await layarAwal.isExisting()).toBe(true);

    await driver.saveScreenshot('../bukti/ios-01-launch.png');
  });
});
