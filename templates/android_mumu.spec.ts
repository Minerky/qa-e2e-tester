// Template terverifikasi — qa-e2e-tester
// Stack: Appium 4.0.0 + uiautomator2@9.2.2 + WebdriverIO 10.x + JDK 21
// Hasil aktual: 1 passing (Test Mode -> login dari env -> Home 4 tab).
//
// ADAPT: ganti QA_PACKAGE / QA_ACTIVITY lewat env bawaannya lain.
// Kredensial WAJIB dari env QA_NIK / QA_PASS. Jangan pernah ditulis ke file/artefak.
// Jalankan dari folder yang berisi wdio.conf.ts:
//   $env:QA_NIK='...'; $env:QA_PASS='...'; npx wdio run wdio.conf.ts

const NIK = process.env.QA_NIK || '';
const PASS = process.env.QA_PASS || '';
const PKG = process.env.QA_PACKAGE || 'com.bhn.advantage.dctmob';

async function tanganiDialogSistem(driver) {
  // Dialog izin bisa muncul di awal DAN belakangan setelah login.
  const tombol = ['WHILE USING THE APP', 'Precise', 'ALLOW', 'Turn on', 'OK'];
  for (let i = 0; i < 8; i++) {
    let acted = false;
    for (const label of tombol) {
      const el = await driver.$('android=new UiSelector().text("' + label + '")');
      if (await el.isExisting()) {
        await el.click();
        await driver.pause(700);
        acted = true;
        break;
      }
    }
    if (!acted) break;
  }
}

async function aktifkanTestMode(driver) {
  const toggle = await driver.$('id:idswitch');
  // Idempoten: jangan klik lagi kalau sudah aktif (klik kedua = MATIKAN).
  if ((await toggle.getAttribute('checked')) === 'true') return true;
  await toggle.click();
  await driver.pause(500);
  // Field PIN punya resource-id yang SAMA dengan password login → harus di-scope
  // ke dialog, kalau tidak WebdriverIO strict mode komplain "resolved to 2 elements".
  const pinField = await driver.$(
    "xpath://*[@resource-id='" + PKG + ":id/dialogplus_view_container']" +
    "//*[@resource-id='" + PKG + ":id/Password']"
  );
  await pinField.setValue('789123'); // PIN Test Mode DCT (konstanta FSD, bukan kredensial user)
  const submit = await driver.$('android=new UiSelector().text("SUBMIT")');
  await submit.click();
  await driver.pause(1000);
  return (await toggle.getAttribute('checked')) === 'true';
}

describe('DCT FLM E2E login - MuMu', () => {
  it('Test Mode -> login user dari env -> Home 4 tab', async () => {
    if (!NIK || !PASS) {
      throw new Error('Set QA_NIK dan QA_PASS dulu (jangan ditulis ke file).');
    }
    expect(await driver.isAppInstalled(PKG)).toBe(true);
    // Tanpa activateApp, Appium bisa kembali ke home launcher MuMu.
    await driver.activateApp(PKG);
    await driver.pause(3000);
    await tanganiDialogSistem(driver);
    expect(await aktifkanTestMode(driver)).toBe(true);

    const uid = await driver.$('id:userId');
    const pwd = await driver.$('id:Password');
    const login = await driver.$('id:btn_login');
    await uid.setValue(NIK);
    await pwd.setValue(PASS);
    await driver.pause(300);
    expect(await uid.getText()).toBe(NIK);
    await login.click();
    await driver.pause(7000);

    // Notifikasi bisa muncul beberapa detik setelah login → tunggu + tangani.
    for (let i = 0; i < 6; i++) {
      await tanganiDialogSistem(driver);
      const map = await driver.$('android=new UiSelector().text("MAP")');
      if (await map.isExisting()) break;
      await driver.pause(2000);
    }
    for (const tab of ['MAP', 'PROBLEM', 'OVERTICKET', 'PROFILE']) {
      const el = await driver.$('android=new UiSelector().text("' + tab + '")');
      expect(await el.isExisting()).toBe(true);
    }
  });
});
