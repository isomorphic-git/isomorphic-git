// package-scripts.js is a convention used by the 'nps' utility
// It's like package.json scripts, but more flexible.
const { concurrent, series, runInNewWindow } = require('nps-utils')

module.exports = {
  scripts: {
    format:
      'prettier-standard src/**/*.js __tests__/**/*.js',
    lint: 'standard src/**/*.js',
    toc: 'doctoc --maxlevel=2 README.md',
    watch: {
      default: concurrent.nps('watch.rollup', 'watch.jest'),
      rollup: runInNewWindow('rollup -cw'),
      jest: runInNewWindow('cross-env DEBUG=isomorphic-git jest --watch'),
      karma: runInNewWindow('karma start')
    },
    build: {
      default: series.nps('build.rollup', 'build.browserify'),
      rollup: 'rollup -c',
      browserify: concurrent.nps('build.sw', 'build.umd', 'build.internalApis'),
      discify: `browserify \
            --entry dist/for-browserify/index.js \
            --standalone git \
            --fullpaths | uglifyjs \
                          --compress \
                          --mangle | discify -O`,
      internalApis: `browserify \
            --entry dist/for-browserify/internal-apis.js \
            --standalone internal \
            --debug | uglifyjs \
                      --compress \
                      --mangle \
                      --source-map "content=inline,url=internal.umd.min.js.map" \
                      -o dist/internal.umd.min.js`,
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
    test: {
      default: process.env.CI ? 'nps test.travis' : 'nps test.local',
      travis: series.nps('lint', 'build', 'test.jest', 'test.karma'),
      local: series.nps('test.jest', 'test.karma'),
      jest: process.env.CI
        ? 'cross-env DEBUG=isomorphic-git jest --coverage && codecov'
        : 'cross-env DEBUG=isomorphic-git jest',
      karma: process.env.CI
        ? 'karma start'
        : 'karma start --browsers ChromeHeadless --single-run'
    }
  }
}
