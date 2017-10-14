// Karma configuration
module.exports = function (config) {
  var customLaunchers = {
    sl_chrome: {
      base: 'SauceLabs',
      browserName: 'chrome'
    },
    sl_firefox: {
      base: 'SauceLabs',
      browserName: 'firefox'
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
      browserName: 'iphone'
    },
    sl_android_chrome: {
      base: 'SauceLabs',
      deviceName: 'Android Emulator',
      platformName: 'Android',
      platformVersion: '6.0',
      browserName: 'Chrome',
      appiumVersion: '1.6.3'
    }
  }
  config.set({
    sauceLabs: {
      testName: 'isomorphic-git'
    },
    customLaunchers: customLaunchers,
    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: Object.keys(customLaunchers),
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',
    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['browserify', 'tap'],
    // list of files / patterns to load in the browser
    files: ['testling/*.js'],
    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'testling/*.js': ['browserify']
    },
    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['dots', 'saucelabs'],
    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,
    // https://support.saucelabs.com/hc/en-us/articles/225104707-Karma-Tests-Disconnect-Particularly-When-Running-Tests-on-Safari
    browserDisconnectTimeout: 10000, // default 2000
    browserDisconnectTolerance: 1, // default 0
    browserNoActivityTimeout: 4 * 60 * 1000, // default 10000
    captureTimeout: 4 * 60 * 1000 // default 60000
  })
}
