// Karma configuration
const path = require('path')
const webpack = require('webpack')

const branchOrPullRequestName = process.env.TRAVIS_PULL_REQUEST === 'false'
  ? process.env.TRAVIS_BRANCH
  : process.env.TRAVIS_PULL_REQUEST_SLUG + '/' + process.env.TRAVIS_PULL_REQUEST_BRANCH

module.exports = function (config) {
  const options = {
    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['FirefoxHeadless'],
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',
    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],
    beforeMiddleware: ['git-http-server'],
    gitHttpServer: {
      root: '__tests__/__fixtures__',
      route: '/git-server'
    },
    // list of files / patterns to load in the browser
    files: [
      '__tests__/test-*.js',
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
      '__tests__/test-*.js': ['webpack']
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
      XXXsl_firefox: {
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
        deviceName: 'iPhone X Simulator',
        platformName: 'iOS',
        platformVersion: '11.2',
        browserName: 'Safari',
        appiumVersion: '1.7.2'
      },
      sl_android_chrome: {
        base: 'SauceLabs',
        deviceName: 'Android GoogleAPI Emulator',
        platformName: 'Android',
        platformVersion: '7.1',
        browserName: 'Chrome',
        appiumVersion: '1.7.2'
      },
      bs_chrome_win: {
        base: 'BrowserStack',
        browser: 'Chrome',
        browser_version: '62.0',
        os: 'Windows',
        os_version: '10'
      },
      bs_firefox_win: {
        base: 'BrowserStack',
        browser: 'Firefox',
        browser_version: '59.0',
        os: 'Windows',
        os_version: '10'
      },
      bs_edge_win: {
        base: 'BrowserStack',
        browser: 'Edge',
        browser_version: '16.0',
        os: 'Windows',
        os_version: '10'
      },
      bs_chrome_mac: {
        base: 'BrowserStack',
        browser: 'Chrome',
        browser_version: '62.0',
        os: 'OS X',
        os_version: 'High Sierra'
      },
      bs_firefox_mac: {
        base: 'BrowserStack',
        browser: 'Firefox',
        browser_version: '59.0',
        os: 'OS X',
        os_version: 'High Sierra'
      },
      bs_safari_mac: {
        base: 'BrowserStack',
        browser: 'Safari',
        browser_version: '11.0',
        os: 'OS X',
        os_version: 'High Sierra'
      },
      bs_safari_iphone: {
        base: 'BrowserStack',
        device: 'iPhone X',
        os: 'ios',
        os_version: '11.0'
      },
      bs_android: {
        base: 'BrowserStack',
        device: 'Google Pixel',
        os: 'android',
        os_version: '8.0'
      },
      FirefoxHeadless: {
        base: 'Firefox',
        flags: ['-headless']
      }
    },
    browserStack: {
      project: 'isomorphic-git',
      name: `isomorphic-git / ${branchOrPullRequestName} / ${process.env.TRAVIS_COMMIT}`,
      build: process.env.TRAVIS_JOB_NUMBER + '-' + Date.now()
    },
    sauceLabs: {
      // Since tags aren't being sent correctly, I'm going to stick the branch name in here.
      testName: `isomorphic-git / ${branchOrPullRequestName} / ${process.env.TRAVIS_COMMIT}`,
      // Note: I added the Date.now() bit so that when I can click "Restart" on a Travis job,
      // Sauce Labs does not simply append new test results to the old set that failed, which
      // convinces karma that it failed again and always.
      build: process.env.TRAVIS_JOB_NUMBER + '-' + Date.now(),
      // Note: it does not appear that tags are being sent correctly.
      tags: [branchOrPullRequestName],
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
    },
    webpack: {
      mode: 'development',
      devtool: 'inline-source-map',
      plugins: [new webpack.IgnorePlugin(/^(fs|jest-fixtures)$/)],
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
    }
  }

  // if (!process.env.SAUCE_USERNAME) {
  //   console.log(
  //     'Skipping SauceLabs tests because SAUCE_USERNAME environment variable is not set.'
  //   )
  // } else if (!process.env.SAUCE_ACCESS_KEY) {
  //   console.log(
  //     'Skipping SauceLabs tests because SAUCE_ACCESS_KEY environment variable is not set.'
  //   )
  // } else {
  //   console.log('---------------')
  //   console.log('---------------')
  //   console.log('---------------')
  //   console.log(process.env.TRAVIS_PULL_REQUEST)
  //   console.log(process.env.TRAVIS_BRANCH)
  //   console.log(process.env.TRAVIS_PULL_REQUEST_SLUG + '/' + process.env.TRAVIS_PULL_REQUEST_BRANCH)
  //   options.browsers = options.browsers.concat(
  //     Object.keys(options.customLaunchers).filter(x => x.startsWith('sl_'))
  //   )
  //   options.reporters.push('saucelabs')
  // }

  if (!process.env.BROWSER_STACK_USERNAME) {
    console.log(
      'Skipping BrowserStack tests because BROWSER_STACK_USERNAME environment variable is not set.'
    )
  } else if (!process.env.BROWSER_STACK_ACCESS_KEY) {
    console.log(
      'Skipping BrowserStack tests because BROWSER_STACK_ACCESS_KEY environment variable is not set.'
    )
  } else {
    // Add bs_ browsers
    options.browsers = options.browsers.concat(
      Object.keys(options.customLaunchers).filter(x => x.startsWith('bs_'))
    )
    options.reporters.push('BrowserStack')
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
