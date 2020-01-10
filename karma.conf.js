// Karma configuration
process.env.CHROME_BIN = require('puppeteer').executablePath()
const path = require('path')
const webpack = require('webpack')

const REPO = process.env.BUILD_REPOSITORY_NAME
const ISSUE =
  process.env.SYSTEM_PULLREQUEST_PULLREQUESTNUMBER ||
  process.env.SYSTEM_PULLREQUEST_PULLREQUESTID
const COMMIT = process.env.BUILD_SOURCEVERSION

module.exports = function (config) {
  const options = {
    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: [],
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',
    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],
    // list of files / patterns to load in the browser
    files: [
      '__tests__/index.webpack.js',
      {
        pattern: '__tests__/__fixtures__/**/*',
        served: true,
        watched: false,
        included: false
      },
      {
        pattern: '__tests__/__fixtures__/**/.superblock.txt',
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
      '__tests__/index.webpack.js': ['webpack']
    },
    // web server port
    port: 9876,
    // enable / disable colors in the output (reporters and logs)
    colors: true,
    // Increase timeouts since some actions take quite a while.
    browserNoActivityTimeout: 4 * 60 * 1000, // default 10000
    // https://support.saucelabs.com/hc/en-us/articles/225104707-Karma-Tests-Disconnect-Particularly-When-Running-Tests-on-Safari
    browserDisconnectTimeout: 10000, // default 2000
    browserDisconnectTolerance: 0, // default 0
    captureTimeout: 4 * 60 * 1000, // default 60000
    // SauceLabs browsers
    customLaunchers: {
      XXXsl_chrome: {
        base: 'SauceLabs',
        browserName: 'chrome',
        extendedDebugging: true
      },
      sl_firefox: {
        base: 'SauceLabs',
        browserName: 'firefox'
      },
      sl_edge: {
        base: 'SauceLabs',
        browserName: 'MicrosoftEdge',
        version: '17.17134'
      },
      sl_safari: {
        base: 'SauceLabs',
        browserName: 'safari',
        platform: 'macOS 10.13',
        version: '11.1'
      },
      sl_ios_safari: {
        base: 'SauceLabs',
        deviceName: 'iPhone X Simulator',
        platformName: 'iOS',
        platformVersion: '11.2',
        browserName: 'Safari',
        appiumVersion: '1.9.1'
      },
      sl_ios_safari12: {
        base: 'SauceLabs',
        deviceName: 'iPhone 8 Simulator',
        platformName: 'iOS',
        platformVersion: '12.0',
        browserName: 'Safari',
        appiumVersion: '1.9.1'
      },
      sl_android_chrome: {
        base: 'SauceLabs',
        deviceName: 'Android GoogleAPI Emulator',
        platformName: 'Android',
        platformVersion: '7.1',
        browserName: 'Chrome',
        appiumVersion: '1.9.1'
      },
      FirefoxHeadless: {
        base: 'Firefox',
        flags: ['-headless']
      },
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox']
      },
      ChromeCanaryHeadlessNoSandbox: {
        base: 'ChromeCanaryHeadless',
        flags: ['--no-sandbox']
      }
    },
    sauceLabs: {
      // Since tags aren't being sent correctly, I'm going to stick the branch name in here.
      testName: `${REPO} / ${ISSUE} / ${COMMIT}`,
      // Note: I added the Date.now() bit so that when I can click "Restart" on a Travis job,
      // Sauce Labs does not simply append new test results to the old set that failed, which
      // convinces karma that it failed again and always.
      build: process.env.BUILD_BUILDID + '-' + Date.now(),
      // Note: it does not appear that tags are being sent correctly.
      tags: [ISSUE],
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
    reporters: ['browsers', 'verbose', 'longest', 'pr-comment', 'junit'],
    junitReporter: {
      outputDir: './junit'
    },
    longestSpecsToReport: 50,
    browserify: {
      transform: [
        // Replace process.env.CI
        'envify'
      ]
    },
    webpack: {
      mode: 'development',
      devtool: 'inline-source-map',
      plugins: [
        new webpack.IgnorePlugin(/^(fs|jest-fixtures)$/),
        new webpack.DefinePlugin({
          'process.env.TEST_PUSH_GITHUB_TOKEN': `'${process.env.TEST_PUSH_GITHUB_TOKEN}'`
        })
      ],
      resolve: {
        alias: {
          'isomorphic-git/internal-apis': path.resolve(
            __dirname,
            'dist/internal.umd.min.js'
            // 'src/internal-apis.js'
          ),
          'isomorphic-git': path.resolve(
            __dirname,
            'dist/bundle.umd.min.js'
            // 'src/index.js'
          )
        }
      }
    },
    plugins: [
      'karma-chrome-launcher',
      'karma-edge-launcher',
      'karma-ie-launcher',
      'karma-safari-launcher',
      'karma-fail-fast-reporter',
      'karma-firefox-launcher',
      'karma-jasmine',
      'karma-junit-reporter',
      'karma-longest-reporter',
      'karma-sauce-launcher',
      'karma-verbose-reporter',
      'karma-webpack',
      {
        'reporter:browsers': [
          'type',
          require('./__tests__/__helpers__/karma-successful-browsers-reporter')
        ]
      },
      {
        'reporter:pr-comment': [
          'type',
          require('./__tests__/__helpers__/karma-pr-comment-reporter')
        ]
      }
    ]
  }

  // Speed things up, at the cost of not saving the test results (except in the stdout log).
  if (process.env.FAILFAST && process.env.FAILFAST === 'true') {
    options.reporters.push('fail-fast')
  }

  if (!process.env.SAUCE_USERNAME) {
    console.log(
      'Skipping SauceLabs tests because SAUCE_USERNAME environment variable is not set.'
    )
  } else if (!process.env.SAUCE_ACCESS_KEY) {
    console.log(
      'Skipping SauceLabs tests because SAUCE_ACCESS_KEY environment variable is not set.'
    )
  } else {
    options.reporters.push('saucelabs')
  }

  if (process.env.TEST_BROWSERS) {
    options.browsers = process.env.TEST_BROWSERS.split(',')
  } else if (!process.env.TEST_NO_BROWSERS) {
    options.browsers.push('ChromeHeadlessNoSandbox')
    options.browsers.push('FirefoxHeadless')
    // options.browsers.push('Edge')
    // options.browsers.push('ChromeCanaryHeadlessNoSandbox')
  }

  if (!process.env.TEST_NO_BROWSERS) {
    // Only re-run browsers that failed in the previous run.
    options.browsers = require('./__tests__/__helpers__/karma-load-successful-browsers.js').filter(
      options.browsers
    )
    console.log('running with browsers:', options.browsers)
  }

  if (!process.env.CI) {
    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    options.singleRun = false
    // enable / disable watching file and executing tests whenever any file changes
    options.autoWatch = true
  }

  config.set(options)
}
