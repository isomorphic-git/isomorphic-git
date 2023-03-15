const loadSuccessfulBrowsers = require('./karma-load-successful-browsers.cjs')

const BrowsersReporter = function(
  baseReporterDecorator,
  config,
  logger,
  helper,
  formatError
) {
  this.browserCount = 0
  this.buildOk = false
  this.successfulBrowsersFullNames = []
  this.successfulBrowsers = []
  this.failedBrowsers = []
  this.onRunStart = function(browsers) {
    this.browserCount = browsers.length
    this.buildOk = true
    // Append to the existing list of successful browsers
    const tmp = loadSuccessfulBrowsers.load()
    this.successfulBrowsersFullNames = tmp[0]
    this.successfulBrowsers = tmp[1]
  }
  this.onBrowserComplete = function(browser) {
    var results = browser.lastResult
    if (results.disconnected || results.error || results.failed) {
      this.buildOk = false
      this.failedBrowsers.push(browser)
      // a bit hacky, but provides a record of failed tests as well this way!
      this.successfulBrowsersFullNames.push('X ' + browser.name)
    } else {
      this.successfulBrowsersFullNames.push(browser.name)
    }
  }
  this.onRunComplete = function() {
    loadSuccessfulBrowsers.save(this.successfulBrowsersFullNames)
  }
}

module.exports = BrowsersReporter
