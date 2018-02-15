// Karma configuration

module.exports = function (config) {
  const options = {
    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: [
      'FirefoxHeadless'
    ],
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',
    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['browserify', 'jasmine'],
    // list of files / patterns to load in the browser
    files: [
      '__tests__/*.spec.js',
      {
        pattern: '__tests__/__fixtures__/**/*',
        served: true,
        watched: false,
        included: false
      },
      {
        pattern: '__tests__/__fixtures__/**/.gitignore',
        served: true,
        watched: false,
        included: false
      }
    ],
    // list of files to exclude
    exclude: [],
    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      '__tests__/*.spec.js': ['browserify']
    },
    // web server port
    port: 9876,
    // enable / disable colors in the output (reporters and logs)
    colors: true,
    // Increase timeouts since some actions take quite a while.
    browserNoActivityTimeout: 4 * 60 * 1000, // default 10000
    // https://support.saucelabs.com/hc/en-us/articles/225104707-Karma-Tests-Disconnect-Particularly-When-Running-Tests-on-Safari
    browserDisconnectTimeout: 10000, // default 2000
    browserDisconnectTolerance: 1, // default 0
    captureTimeout: 4 * 60 * 1000, // default 60000
    // SauceLabs browsers
    customLaunchers: {
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
      },
      FirefoxHeadless: {
        base: 'Firefox',
        flags: [
          '-headless'
        ]
      }
    },
    sauceLabs: {
      testName: 'isomorphic-git',
      build: process.env.TRAVIS_JOB_NUMBER + '-' + Date.now(),
      recordScreenshots: false,
      recordVideo: false,
      public: 'public restricted'
    },
    concurrency: 5,
    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,
    // test results reporter to use
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['verbose'],
    browserify: {
      transform: [
        // Replace process.env.CI
        'envify'
      ]
    }
  }

  if (!process.env.SAUCE_USERNAME) {
    console.log('Skipping SauceLabs tests because SAUCE_USERNAME environment variable is not set.')
  } else if (!process.env.SAUCE_ACCESS_KEY) {
    console.log('Skipping SauceLabs tests because SAUCE_ACCESS_KEY environment variable is not set.')
  } else {
    options.browsers = options.browsers.concat(
      Object.keys(options.customLaunchers)
        .filter(x => x.startsWith('sl_'))
    )
    options.reporters.push('saucelabs')
  }

  if (!process.env.CI) {
    options.browsers.push('ChromeHeadless')
    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    options.singleRun = false
    // enable / disable watching file and executing tests whenever any file changes
    options.autoWatch = true
  }

  config.set(options)
}
