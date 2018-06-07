// package-scripts.js is a convention used by the 'nps' utility
// It's like package.json scripts, but more flexible.
const { concurrent, series, runInNewWindow } = require('nps-utils')

const retry = n => cmd =>
  Array(n)
    .fill(`(${cmd})`)
    .join(` || `)
const retry3 = retry(3)

const quote = cmd => cmd.replace(new RegExp("'", 'g'), "\\'")

const optional = cmd =>
  `${cmd} || echo "Optional command '${quote(cmd)}' failed".`

const timeout = n => cmd => `timeout --signal=KILL ${n}m ${cmd}`
const timeout5 = timeout(5)

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
      typescript: 'tsc src/index.d.ts'
    },
    watch: {
      default: concurrent.nps('watch.rollup', 'watch.jest'),
      rollup: runInNewWindow('rollup -cw'),
      jest: runInNewWindow('cross-env DEBUG=isomorphic-git jest --watch'),
      karma: runInNewWindow('karma start')
    },
    contributors: {
      add: 'all-contributors add',
      generate: 'all-contributors generate',
      check: 'all-contributors check'
    },
    build: {
      default: series.nps('build.rollup', 'build.webpack', 'build.indexjson'),
      webpack: 'webpack',
      rollup: 'rollup -c',
      indexjson: `node __tests__/__helpers__/make_http_index.js`
    },
    test: {
      // We run jest in Travis so we get accurate code coverage that's mapped to the original source.
      // But by default, we skip 'jest' because I decided to make it an optionalDependency after it was
      // pointed out to me that it depends on native modules that don't have prebuilt binaries available,
      // and no one should be required to install Python and a C++ compiler to contribute to this code.
      default: process.env.CI
        ? series.nps(
          'lint',
          'test.jest',
          'test.uploadcoverage',
          'build',
          'test.size',
          'test.jasmine',
          'test.karma'
        )
        : series.nps('lint', 'build', 'test.jasmine', 'test.karma'),
      size: optional(timeout(1)('bundlesize')),
      jasmine: retry3('cross-env NODE_PATH=./dist/for-node jasmine'),
      jest: process.env.CI
        ? retry3(`cross-env BABEL_ENV=jest ${timeout5('jest --ci --coverage')}`)
        : 'cross-env BABEL_ENV=jest jest --ci',
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
