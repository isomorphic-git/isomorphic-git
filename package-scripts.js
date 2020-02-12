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

const srcPaths = '*.js src/*.js src/**/*.js __tests__/*.js __tests__/**/*.js'

module.exports = {
  scripts: {
    lint: {
      default: series.nps('lint.js'),
      js: `standard ${srcPaths}`,
      fix: `standard --fix ${srcPaths}`
    },
    watch: {
      default: concurrent.nps('watch.rollup', 'watch.jest'),
      rollup: runInNewWindow('rollup -cw'),
      jest: runInNewWindow('cross-env DEBUG=* jest --watch'),
      karma: runInNewWindow('karma start')
    },
    contributors: {
      add: 'node ./__tests__/__helpers__/add-contributor.js',
      generate: 'all-contributors generate',
      check: 'all-contributors check'
    },
    build: {
      default: series.nps(
        'build.rollup',
        'build.typings',
        'build.webpack',
        'build.indexjson',
        'build.treeshake',
        'build.docs',
        'build.size'
      ),
      rollup: 'rollup -c --no-treeshake',
      typings: 'tsc -p declaration.tsconfig.json',
      webpack: 'webpack',
      indexjson: `node __tests__/__helpers__/make_http_index.js`,
      treeshake: 'agadoo',
      docs: 'node ./__tests__/__helpers__/generate-docs.js',
      size: process.env.CI
        ? optional(
          `cross-env ` +
              `BUNDLEWATCH_GITHUB_TOKEN='${process.env.BUNDLEWATCH_GITHUB_TOKEN}' ` +
              `CI_REPO_OWNER='isomorphic-git' ` +
              `CI_REPO_NAME='isomorphic-git' ` +
              `CI_COMMIT_SHA='${process.env.TRAVIS_PULL_REQUEST_SHA}' ` +
              `CI_BRANCH='${process.env.SYSTEM_PULLREQUEST_SOURCEBRANCH}' ` +
              `bundlewatch`
        )
        : optional(`cross-env bundlewatch dist/bundle.umd.min.js`)
    },
    website: {
      default: process.env.CI
        ? series.nps(
          'website.codemirrorify',
          'website.cpstatic',
          'website.build',
          'website.publish'
        )
        : series.nps(
          'website.codemirrorify',
          'website.cpstatic',
          'website.dev'
        ),
      codemirrorify:
        '(cd website/packages/codemirrorify && npm install && npm run build)',
      cpstatic:
        'cp dist/bundle.umd.min.* website/static/js && cp dist/http.js website/static/js && cp website/packages/codemirrorify/dist/main.js website/static/js/codemirrorify.js',
      build: '(cd website && npm install && npm run build)',
      dev: '(cd website && npm start)',
      publish: '(cd website && node ./scripts/deploy-gh-pages.js)'
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
      default: process.env.CI
        ? series.nps(
          'lint',
          'build',
          'test.typecheck',
          'test.setup',
          'test.jest',
          'test.karma',
          'test.teardown'
        )
        : series.nps(
          'lint',
          'build',
          'test.typecheck',
          'test.setup',
          'test.jest',
          'test.karma',
          'test.teardown'
        ),
      typecheck: 'tsc -p tsconfig.json',
      setup: series.nps('proxy.start', 'gitserver.start'),
      teardown: series.nps('proxy.stop', 'gitserver.stop'),
      jest: process.env.CI
        ? retry3(`${timeout5('jest --ci --coverage')}`)
        : `jest --ci --coverage`,
      karma: process.env.CI
        ? retry3('karma start --single-run')
        : 'cross-env karma start --single-run',
      karmore: 'cross-env TEST_NO_BROWSERS=1 karma start --no-single-run'
    },
    prepublish: {
      default: series.nps('prepublish.version', 'build'),
      version: `node __tests__/__helpers__/fix-version-number.js`
    }
  }
}
