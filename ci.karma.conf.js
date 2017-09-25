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
    files: [
      'testling/*.js'
    ],
    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'testling/*.js': [ 'browserify' ]
    },
    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['dots', 'saucelabs'],
    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true
  })
}
