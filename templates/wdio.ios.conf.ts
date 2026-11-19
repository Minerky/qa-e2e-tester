// Template Appium XCUITest — qa-e2e-tester
// BELUM DIVERIFIKASI di mesin referensi. Hanya bisa dijalankan di macOS + Xcode.
//   appium server --port 4723 --base-path /wd/hub
//   QA_BUNDLE_ID=com.example.app QA_UDID=<sim-udid> npx wdio run wdio.ios.conf.ts

export const config = {
  runner: 'local',
  specs: ['./ios_xcuitest.spec.ts'],
  maxInstances: 1,
  protocol: 'http',
  hostname: '127.0.0.1',
  port: 4723,
  path: '/wd/hub',
  capabilities: [{
    platformName: 'iOS',
    'appium:automationName': 'XCUITest',
    'appium:udid': process.env.QA_UDID || '',
    'appium:bundleId': process.env.QA_BUNDLE_ID || '',
    'appium:noReset': false,
    'appium:newCommandTimeout': 120,
  }],
  logLevel: 'warn',
  waitforTimeout: 15000,
  reporters: ['spec'],
  framework: 'mocha',
  mochaOpts: { ui: 'bdd', timeout: 180000 },
};
