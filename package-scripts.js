// package-scripts.js is a convention used by the 'nps' utility
// It's like package.json scripts, but more flexible.
const { concurrent, series, runInNewWindow } = require('nps-utils')

module.exports = {
  scripts: {
    format: 'prettier-standard src/**/*.js test/**/*.js testling/**/*.js *.js',
    lint: 'standard src/**/*.js',
    watch: {
      default: concurrent.nps('watch.rollup', 'watch.ava'),
      rollup: runInNewWindow('rollup -cw'),
      ava: runInNewWindow('ava -w')
    },
    build: {
      default: series.nps('build.rollup', 'build.umd'),
      rollup: 'rollup -c',
      umd:
        'browserify --entry dist/for-browserify/index.js --standalone git | uglifyjs > dist/bundle.umd.min.js'
    },
    test: {
      default: series.nps('build', 'test.parallel_tests'),
      parallel_tests: concurrent.nps('test.travis', 'test.travis.karma'),
      travis: {
        default: series.nps(
          'test.travis.ava',
          'test.travis.nyc',
          'test.travis.codecov'
        ),
        ava: 'ava --tap',
        nyc: "nyc ava --tap || echo 'nyc failed, no big deal'",
        codecov:
          "nyc report --reporter=lcov > coverage.lcov && codecov || echo 'codecov failed, no big deal'",
        karma:
          "karma start ci.karma.conf.js || echo 'saucelabs failed, no big deal'"
      }
    }
  }
}
