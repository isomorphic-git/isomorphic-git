// Karma configuration
module.exports = function (config) {
  config.set({
    sauceLabs: {
      testName: 'isomorphic-git'
    },
    customLaunchers: {
      sl_chrome: {
        base: 'SauceLabs',
        browserName: 'chrome'
      },
      sl_firefox: {
        base: 'SauceLabs',
        browserName: 'firefox'
      }
    },
    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['sl_chrome', 'sl_firefox'],
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
