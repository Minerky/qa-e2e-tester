// Template terverifikasi — qa-e2e-tester
// Jalankan Appium server dulu:
//   appium server --port 4723 --base-path /wd/hub
// Lalu: npx wdio run wdio.conf.ts
//
// QA_UDID / QA_PACKAGE / QA_ACTIVITY bisa dioverride lewat env.

export const config = {
  runner: 'local',
  specs: ['./android_mumu.spec.ts'],
  maxInstances: 1,
  protocol: 'http',
  hostname: '127.0.0.1',
  port: 4723,
  path: '/wd/hub',
  capabilities: [{
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:udid': process.env.QA_UDID || '127.0.0.1:16384',
    'appium:appPackage': process.env.QA_PACKAGE || 'com.bhn.advantage.dctmob',
    'appium:appActivity': process.env.QA_ACTIVITY || 'com.bhn.advantage.dctmob.SplashActivity',
    'appium:noReset': false,
    'appium:newCommandTimeout': 120,
  }],
  logLevel: 'warn',
  waitforTimeout: 15000,
  reporters: ['spec'],
  framework: 'mocha',
  mochaOpts: { ui: 'bdd', timeout: 180000 },
};
