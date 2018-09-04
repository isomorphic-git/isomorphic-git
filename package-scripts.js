// package-scripts.js is a convention used by the 'nps' utility
// It's like package.json scripts, but more flexible.
const { concurrent, series, runInNewWindow } = require('nps-utils')

const retry = n => cmd =>
  Array(n)
    .fill(`(${cmd})`)
    .join(` || `)
const retry3 = retry(3)

const quote = cmd =>
  cmd.replace(new RegExp("'", 'g'), "\\'").replace(new RegExp('"', 'g'), '\\"')

const optional = cmd =>
  `(${cmd}) || echo "Optional command '${quote(cmd)}' failed".`

const timeout = n => cmd => `timeout --signal=KILL ${n}m ${cmd}`
const timeout5 = timeout(5)

const or = (a, b) => `(${a}) || (${b})`

const srcPaths = '*.js src/*.js src/**/*.js __tests__/*.js __tests__/**/*.js'

module.exports = {
  scripts: {
    format: {
      default: series.nps('format.imports', 'format.prettier'),
      imports: `node ./node_modules/organize-js-imports -maxNamesLength 0 -paths ${srcPaths}`,
      prettier: retry3(`prettier-standard ${srcPaths}`)
    },
    lint: {
      default: series.nps('lint.js', 'lint.typescript'),
      js: `standard ${srcPaths}`,
      typescript: 'tsc src/index.d.ts --lib es6'
    },
    watch: {
      default: concurrent.nps('watch.rollup', 'watch.jest'),
      rollup: runInNewWindow('rollup -cw'),
      jest: runInNewWindow('cross-env DEBUG=* jest --watch'),
      karma: runInNewWindow('karma start')
    },
    contributors: {
      add: 'all-contributors add',
      generate: 'all-contributors generate',
      check: 'all-contributors check'
    },
    build: {
      default: series.nps(
        'build.rollup',
        'build.webpack',
        'build.indexjson',
        'build.size'
      ),
      webpack: 'webpack',
      rollup: 'rollup -c',
      indexjson: `node __tests__/__helpers__/make_http_index.js`,
      size: optional('bundlesize')
    },
    // 'proxy' needs to run in the background during tests. I'm too lazy to auto start/stop it from within the browser tests.
    proxy: `cd node_modules/@isomorphic-git/cors-proxy && micro --listen=tcp://0.0.0.0:9999`,
    test: {
      // We run jest in Travis so we get accurate code coverage that's mapped to the original source.
      // But by default, we skip 'jest' because I decided to make it an optionalDependency after it was
      // pointed out to me that it depends on native modules that don't have prebuilt binaries available,
      // and no one should be required to install Python and a C++ compiler to contribute to this code.
      default: process.env.CI
        ? series.nps(
          'lint',
          'build',
          'test.size',
          'test.one',
          'test.uploadcoverage',
          'test.karma'
        )
        : series.nps('lint', 'build', 'test.one', 'test.karma'),
      size: optional(timeout(1)('bundlesize')),
      one: retry3(or('nps test.jest', 'nps test.jasmine')),
      jasmine: process.env.CI
        ? `cross-env NODE_PATH=./dist/for-node ${timeout5('jasmine')}`
        : `cross-env NODE_PATH=./dist/for-node jasmine`,
      jest: process.env.CI ? `${timeout5('jest --ci')}` : `jest --ci`,
      uploadcoverage: optional(timeout(1)('codecov')),
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
