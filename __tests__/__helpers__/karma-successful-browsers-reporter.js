const loadSuccessfulBrowsers = require('./karma-load-successful-browsers.js')

const BrowsersReporter = function (
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
  this.onRunStart = function (browsers) {
    this.browserCount = browsers.length
    this.buildOk = true
    // Append to the existing list of successful browsers
    let tmp = loadSuccessfulBrowsers.load()
    this.successfulBrowsersFullNames = tmp[0]
    this.successfulBrowsers = tmp[1]
  }
  this.onBrowserComplete = function (browser) {
    var results = browser.lastResult
    if (results.disconnected || results.error || results.failed) {
      this.buildOk = false
      this.failedBrowsers.push(browser)
    } else {
      this.successfulBrowsersFullNames.push(browser.name)
    }
  }
  this.onRunComplete = function () {
    loadSuccessfulBrowsers.save(this.successfulBrowsersFullNames)
    // workaround karma hanging in Azure
    if (this.failedBrowsers.length === 0) {
      setTimeout(function () {
        process.exit(0)
      }, 5000)
    } else {
      setTimeout(function () {
        process.exit(1)
      }, 5000)
    }
  }
}

module.exports = BrowsersReporter
