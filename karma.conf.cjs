// Karma configuration
process.env.CHROME_BIN = require('puppeteer').executablePath()
const path = require('path')

const webpack = require('webpack')

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
      // The fixtures are fetched individually by ZenFS' Fetch backend, so every
      // file must be served — including dotfiles (`.gitignore`, `.gitkeep`,
      // `.superblock.txt`, …) and the contents of dot-directories, which the
      // `**/*` glob skips by default.
      {
        pattern: '__tests__/__fixtures__/**/*',
        served: true,
        watched: false,
        included: false,
      },
      {
        pattern: '__tests__/__fixtures__/**/.*',
        served: true,
        watched: false,
        included: false,
      },
      {
        pattern: '__tests__/__fixtures__/**/.*/**',
        served: true,
        watched: false,
        included: false,
      },
      // 1x1 image served for the browsers (Safari) that request favicons /
      // apple-touch icons, to avoid a flood of 404 warnings in the logs.
      {
        pattern: '__tests__/__helpers__/1px.png',
        served: true,
        watched: false,
        included: false,
      },
    ],
    // Serve a 1x1 image for the icon paths Safari requests at the site root, so
    // they don't spam the log with 404s.
    proxies: {
      '/favicon.ico': '/base/__tests__/__helpers__/1px.png',
      '/apple-touch-icon.png': '/base/__tests__/__helpers__/1px.png',
      '/apple-touch-icon-precomposed.png': '/base/__tests__/__helpers__/1px.png',
    },
    // list of files to exclude
    exclude: [],
    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      '__tests__/index.webpack.js': ['webpack'],
    },
    // web server port
    port: 9876,
    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // Timeouts are kept generous enough for slow BrowserStack sessions, but far
    // below the previous 5-minute values so a dead/hung (e.g. disconnected Safari)
    // session fails fast instead of stalling the whole run for minutes.
    // Refer to:
    // - https://github.com/karma-runner/karma-browserstack-launcher/issues/61
    captureTimeout: 12e4, // 2 min — initial browser capture on BrowserStack
    browserNoActivityTimeout: 12e4, // 2 min (> the 60s jasmine test timeout)
    browserDisconnectTimeout: 6e4, // 1 min to reconnect after a disconnect
    browserDisconnectTolerance: 3,

    customLaunchers: {
      // Cross-platform browsers run on BrowserStack. Versions target a
      // "few years old" buffer: recent enough to run modern JS (the 2020-era
      // Edge 79 / Safari 14 failed on modern syntax), but old enough to cover
      // users who have not updated in a couple of years.
      // NOTE: these BrowserStack browser/os/device strings can only be validated
      // in CI (they need the BROWSER_STACK_* secrets); adjust if a combination is
      // reported as unavailable.
      bs_edge: {
        base: 'BrowserStack',
        browser: 'edge',
        browser_version: '110.0',
        os: 'Windows',
        os_version: '11',
      },
      bs_safari: {
        base: 'BrowserStack',
        browser: 'safari',
        browser_version: '16.0',
        os: 'OS X',
        os_version: 'Ventura',
      },
      bs_ios_safari: {
        base: 'BrowserStack',
        device: 'iPhone 14',
        os: 'ios',
        os_version: '16',
        real_mobile: true,
      },
      bs_android_chrome: {
        base: 'BrowserStack',
        os: 'android',
        os_version: '12.0',
        browser: 'chrome',
        device: 'Samsung Galaxy S22',
        real_mobile: true,
        captureTimeout: 5 * 60 * 1000, // defaults to 120 ms
        timeout: 1000,                 // defaults to 300 ms
      },
      FirefoxHeadless: {
        base: 'Firefox',
        flags: ['-headless'],
      },
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox'],
      },
      ChromeCanaryHeadlessNoSandbox: {
        base: 'ChromeCanaryHeadless',
        flags: ['--no-sandbox'],
      },
    },
    concurrency: 6,
    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,
    // test results reporter to use
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['browsers', 'verbose', 'pr-comment', 'junit'],
    junitReporter: {
      outputDir: './junit',
    },
    webpack: {
      mode: 'development',
      devtool: 'inline-source-map',
      // isomorphic-git's package.json sets "sideEffects": false, which makes
      // webpack tree-shake side-effect-only imports — including the
      // `import './jasmine-inline-snapshots.js'` in index.webpack.js that
      // registers the toMatchInlineSnapshot matcher and describe.skip aliases.
      // Disable that optimization so the test setup module is always kept.
      optimization: { sideEffects: false },
      module: {
        rules: [
          {
            // The aliased browser bundles below are UMD. Because package.json sets
            // "type": "module", webpack would otherwise treat these `.js` files as
            // ES modules (which expose no named exports), breaking imports like
            // `import { FileSystem } from 'isomorphic-git/internal-apis'`. Forcing
            // `javascript/auto` lets webpack use CommonJS interop for them.
            test: /\.umd\.min\.js$/,
            type: 'javascript/auto',
          },
        ],
      },
      plugins: [
        new webpack.IgnorePlugin({
          resourceRegExp: /^@wmhilton\/jest-fixtures$/,
        }),
        // Webpack 5 no longer injects the `Buffer` and `process` globals that the
        // browser tests rely on (webpack 4 did automatically).
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: require.resolve('process/browser'),
        }),
        new webpack.DefinePlugin({
          'process.env.TEST_PUSH_GITHUB_TOKEN': `'${process.env.TEST_PUSH_GITHUB_TOKEN}'`,
        }),
      ],
      resolve: {
        alias: {
          'isomorphic-git/internal-apis': path.resolve(
            __dirname,
            'internal-apis.umd.min.js'
          ),
          'isomorphic-git/http': path.resolve(__dirname, 'http/web/index.js'),
          'isomorphic-git': path.resolve(__dirname, 'index.umd.min.js'),
          // `resolve.fallback` only applies to bare core-module names, not the
          // `path/posix` subpath used by the utils/join tests, so alias it.
          'path/posix': require.resolve('path-browserify'),
        },
        // Webpack 5 no longer polyfills Node core modules automatically (webpack 4
        // did). The test files and their helpers reference a few Node built-ins:
        //  - `path` / `path/posix` are used in the browser (e.g. utils/join tests),
        //    so they need a real polyfill.
        //  - `os`, `url`, `https`, `assert` are only reached from Node-only code
        //    paths (e.g. makeNodeFixture), so an empty stub is enough.
        // `fs` is handled by the IgnorePlugin above.
        fallback: {
          path: require.resolve('path-browserify'),
          os: require.resolve('os-browserify/browser'),
          buffer: require.resolve('buffer/'),
          process: require.resolve('process/browser'),
          fs: false,
          url: false,
          https: false,
          assert: false,
        },
      },
    },
    plugins: [
      'karma-browserstack-launcher',
      'karma-chrome-launcher',
      'karma-edge-launcher',
      'karma-ie-launcher',
      'karma-safari-launcher',
      'karma-fail-fast-reporter',
      'karma-firefox-launcher',
      'karma-jasmine',
      'karma-junit-reporter',
      'karma-verbose-reporter',
      'karma-webpack',
      {
        'reporter:browsers': [
          'type',
          require('./__tests__/__helpers__/karma-successful-browsers-reporter.cjs'),
        ],
      },
      {
        'reporter:pr-comment': [
          'type',
          require('./__tests__/__helpers__/karma-pr-comment-reporter.cjs'),
        ],
      },
    ],
    client: {
      jasmine: {
        timeoutInterval: 60000, // Defaults to 5000 ms
      },
    },
  }

  // Speed things up, at the cost of not saving the test results (except in the stdout log).
  if (process.env.FAILFAST && process.env.FAILFAST === 'true') {
    options.reporters.push('fail-fast')
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
    options.browsers =
      require('./__tests__/__helpers__/karma-load-successful-browsers.cjs').filter(
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
