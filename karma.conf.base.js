// Karma configuration

module.exports = {
  // base path that will be used to resolve all patterns (eg. files, exclude)
  basePath: '',
  // frameworks to use
  // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
  frameworks: ['browserify', 'jasmine'],
  // list of files / patterns to load in the browser
  files: [
    '__tests__/*.spec.js',
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
    '__tests__/*.spec.js': ['browserify']
  },
  // web server port
  port: 9876,
  // enable / disable colors in the output (reporters and logs)
  colors: true,
  // Increase timeouts since some actions take quite a while.
  browserNoActivityTimeout: 4 * 60 * 1000 // default 10000
}
