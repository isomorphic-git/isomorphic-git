// package-scripts.js is a convention used by the 'nps' utility
// It's like package.json scripts, but more flexible.
const { concurrent, series, runInNewWindow } = require('nps-utils')

const retry = n => cmd => Array(n).fill(`(${cmd})`).join(` || `)
const retry3 = retry(3)

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
      indexjson: `node __tests__/__helpers__/make_http_index.js`,
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
      // We run jest in Travis so we get accurate code coverage that's mapped to the original source.
      // But by default, we skip 'jest' because I decided to make it an optionalDependency after it was
      // pointed out to me that it depends on native modules that don't have prebuilt binaries available,
      // and no one should be required to install Python and a C++ compiler to contribute to this code.
      default: process.env.CI
        ? series.nps('lint', 'test.jest', 'build', 'test.jasmine', 'test.karma')
        : series.nps('lint', 'build', 'test.jasmine', 'test.karma'),
      jasmine: retry3('cross-env NODE_PATH=./dist/for-node jasmine --reporter=jasmine-console-reporter'),
      jest: process.env.CI
        ? retry3('timeout --signal=KILL 5m jest --ci --coverage && codecov')
        : 'jest --ci',
      karma: process.env.CI
        ? retry3('karma start --single-run')
        : 'karma start --single-run'
    }
  }
}
