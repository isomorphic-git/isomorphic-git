// package-scripts.js is a convention used by the 'nps' utility
// It's like package.json scripts, but more flexible.
const { concurrent, series, runInNewWindow } = require('nps-utils')

module.exports = {
  scripts: {
    format:
      'prettier-standard src/**/*.js __tests__/**/*.js testling/**/*.js *.js',
    lint: 'standard src/**/*.js',
    toc: 'doctoc README.md',
    watch: {
      default: concurrent.nps('watch.rollup', 'watch.jest'),
      rollup: runInNewWindow('rollup -cw'),
      jest: runInNewWindow('jest --watch')
    },
    build: {
      default: series.nps('build.rollup', 'build.browserify'),
      rollup: 'rollup -c',
      browserify: concurrent.nps('build.sw', 'build.umd'),
      discify: `browserify \
            --entry dist/for-browserify/index.js \
            --standalone git \
            --fullpaths | uglifyjs \
                          --compress \
                          --mangle | discify -O`,
      umd: `browserify \
            --entry dist/for-browserify/index.js \
            --standalone git \
            --debug | uglifyjs \
                      --compress \
                      --mangle \
                      --source-map "content=inline,url=bundle.umd.min.js.map" \
                      -o dist/bundle.umd.min.js`,
      sw: `browserify \
           --entry dist/for-serviceworker/index.js \
           --standalone git \
           --debug | uglifyjs \
                     --compress \
                     --mangle \
                     --source-map "content=inline,url=service-workder-bundle.umd.min.js.map" \
                     -o dist/service-worker-bundle.umd.min.js`
    },
    doc: {
      default: series.nps('doc.esdoc', 'doc.copy'),
      esdoc: 'esdoc',
      copy: 'cp -R dist/* doc/',
      watch: 'watch "nps doc.esdoc" src'
    },
    test: {
      default: process.env.CI ? 'nps test.travis' : 'nps test.local',
      travis: series.nps('build', 'doc', 'test.parallel'),
      local: 'nps test.jest',
      parallel_tests: concurrent.nps('test.jest', 'test.karma'),
      jest: process.env.CI ? 'jest --coverage && codecov' : 'jest',
      karma: process.env.CI
        ? "karma start ci.karma.conf.js || echo 'saucelabs failed, no big deal'"
        : 'karma start'
    }
  }
}
