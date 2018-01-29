// Karma configuration
const base = require('./karma.conf.base')

module.exports = Object.assign({}, base, {
  // test results reporter to use
  // possible values: 'dots', 'progress'
  // available reporters: https://npmjs.org/browse/keyword/karma-reporter
  reporters: ['progress'],
  // web server port
  port: 9876,
  // enable / disable watching file and executing tests whenever any file changes
  autoWatch: true,
  // start these browsers
  // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
  browsers: ['Firefox'],
  // Continuous Integration mode
  // if true, Karma captures browsers, runs the tests and exits
  singleRun: false,
  // Concurrency level
  // how many browser should be started simultaneous
  concurrency: Infinity
})
