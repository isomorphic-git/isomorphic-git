// package-scripts.js is a convention used by the 'nps' utility
// It's like package.json scripts, but more flexible.
const { concurrent, series, runInNewWindow } = require('nps-utils')

// Polyfill TRAVIS_PULL_REQUEST_SHA environment variable
require('./__tests__/__helpers__/set-TRAVIS_PULL_REQUEST_SHA.js')

const retry = n => cmd =>
  Array(n)
    .fill(`(${cmd})`)
    .join(` || `)
const retry3 = retry(3)

const quote = cmd =>
  cmd.replace(new RegExp("'", 'g'), "\\'").replace(new RegExp('"', 'g'), '\\"')

const optional = cmd =>
  `(${cmd}) || echo "Optional command '${quote(cmd)}' failed".`

const timeout = n => cmd => `timeout -t ${n}m -- ${cmd}`
const timeout5 = timeout(5)

const or = (a, b) => `(${a}) || (${b})`

const srcPaths = '*.js src/*.js src/**/*.js __tests__/*.js __tests__/**/*.js'

module.exports = {
  scripts: {
    lint: {
      default: series.nps('lint.js', 'lint.typescript'),
      js: `standard ${srcPaths}`,
      typescript: 'tsc src/index.d.ts --lib es6',
      typescriptTests: 'tsc -p tsconfig.json'
    },
    watch: {
      default: concurrent.nps('watch.rollup', 'watch.jest'),
      rollup: runInNewWindow('rollup -cw'),
      jest: runInNewWindow('cross-env DEBUG=* jest --watch'),
      karma: runInNewWindow('karma start')
    },
    contributors: {
      add: 'all-contributors add',
      generate:
        'all-contributors generate && node ./__tests__/__helpers__/fix-all-contributors.js',
      check: 'all-contributors check'
    },
    build: {
      default: series.nps(
        'build.rollup',
        'build.webpack',
        'build.indexjson',
        'build.treeshake',
        'build.size'
      ),
      webpack: 'webpack',
      rollup: 'rollup -c',
      indexjson: `node __tests__/__helpers__/make_http_index.js`,
      treeshake: 'agadoo',
      size: optional(
        `cross-env TRAVIS=true ` +
          `GITHUB_TOKEN=${process.env.BUNDLESIZE_GITHUB_TOKEN} ` +
          `TRAVIS_REPO_SLUG=${process.env.TRAVIS_REPO_SLUG ||
            process.env.BUILD_REPOSITORY_NAME} ` +
          // TODO: Figure out what the Azure equivalent of TRAVIS_PULL_REQUEST_SHA is.
          `TRAVIS_PULL_REQUEST_SHA=${process.env.TRAVIS_PULL_REQUEST_SHA} ` +
          `bundlesize`
      )
    },
    // ATTENTION:
    // LIST OF SAFE PORTS FOR SAUCE LABS (Edge and Safari) https://wiki.saucelabs.com/display/DOCS/Sauce+Connect+Proxy+FAQS#SauceConnectProxyFAQS-CanIAccessApplicationsonlocalhost?
    // 'proxy' needs to run in the background during tests. I'm too lazy to auto start/stop it from within the browser tests.
    proxy: {
      default: `cors-proxy start -p 9999`,
      start: `cors-proxy start -p 9999 -d`,
      stop: `cors-proxy stop`
    },
    gitserver: {
      default: `cross-env GIT_HTTP_MOCK_SERVER_PORT=8888 GIT_HTTP_MOCK_SERVER_ROOT=__tests__/__fixtures__ git-http-mock-server`,
      start: `cross-env GIT_HTTP_MOCK_SERVER_PORT=8888 GIT_HTTP_MOCK_SERVER_ROOT=__tests__/__fixtures__ git-http-mock-server start`,
      stop: `cross-env GIT_HTTP_MOCK_SERVER_PORT=8888 GIT_HTTP_MOCK_SERVER_ROOT=__tests__/__fixtures__ git-http-mock-server stop`
    },
    test: {
      // We run jest in Travis so we get accurate code coverage that's mapped to the original source.
      // But by default, we skip 'jest' because I decided to make it an optionalDependency after it was
      // pointed out to me that it depends on native modules that don't have prebuilt binaries available,
      // and no one should be required to install Python and a C++ compiler to contribute to this code.
      default: process.env.CI
        ? series.nps(
          'lint',
          'build',
          'test.setup',
          'test.one',
          'test.karma',
          'test.teardown'
        )
        : series.nps(
          'lint',
          'build',
          'test.setup',
          'test.one',
          'test.karma',
          'test.teardown'
        ),
      setup: series.nps('proxy.start', 'gitserver.start'),
      teardown: series.nps('proxy.stop', 'gitserver.stop'),
      one: retry3(or('nps test.jest', 'nps test.jasmine')),
      jasmine: process.env.CI
        ? `cross-env NODE_PATH=./dist/for-node ${timeout5('jasmine')}`
        : `cross-env NODE_PATH=./dist/for-node jasmine`,
      jest: process.env.CI
        ? `${timeout5('jest --ci --coverage')}`
        : `jest --ci --coverage`,
      karma: process.env.CI
        ? retry3('karma start --single-run')
        : 'karma start --single-run'
    },
    prepublish: {
      default: series.nps('prepublish.version', 'build'),
      version: `node __tests__/__helpers__/fix-version-number.js`
    }
  }
}
