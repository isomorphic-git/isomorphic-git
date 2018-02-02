// Karma configuration
const base = require('./karma.conf.base')

const customLaunchers = {
  sl_chrome: {
    base: 'SauceLabs',
    browserName: 'chrome',
    extendedDebugging: true
  },
  sl_firefox: {
    base: 'SauceLabs',
    browserName: 'firefox',
    extendedDebugging: true
  },
  sl_edge: {
    base: 'SauceLabs',
    browserName: 'MicrosoftEdge'
  },
  sl_safari: {
    base: 'SauceLabs',
    browserName: 'safari'
  },
  sl_ios_safari: {
    base: 'SauceLabs',
    deviceName: 'iPhone Simulator',
    platformName: 'iOS',
    platformVersion: '11.0',
    browserName: 'Safari',
    appiumVersion: '1.7.1'
  },
  sl_android_chrome: {
    base: 'SauceLabs',
    deviceName: 'Android Emulator',
    platformName: 'Android',
    platformVersion: '6.0',
    browserName: 'Chrome',
    appiumVersion: '1.7.1'
  }
}


if (!process.env.SAUCE_USERNAME) {
  console.log('Skipping SauceLabs tests because SAUCE_USERNAME environment variable is not set.')
  module.exports = base
} else if (!process.env.SAUCE_ACCESS_KEY) {
  console.log('Skipping SauceLabs tests because SAUCE_ACCESS_KEY environment variable is not set.')
  module.exports = base
} else {
  module.exports = Object.assign({}, base, {
    sauceLabs: {
      testName: 'isomorphic-git',
      connectOptions: {
        tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER
      }
    },
    concurrency: 5,
    customLaunchers: customLaunchers,
    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: Object.keys(customLaunchers),
    // test results reporter to use
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['verbose', 'saucelabs'],
    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,
    // https://support.saucelabs.com/hc/en-us/articles/225104707-Karma-Tests-Disconnect-Particularly-When-Running-Tests-on-Safari
    browserDisconnectTimeout: 10000, // default 2000
    browserDisconnectTolerance: 1, // default 0
    captureTimeout: 4 * 60 * 1000 // default 60000
  })
}