const fs = require('fs')
const path = require('path')

const BrowsersReporter = function (
  baseReporterDecorator,
  config,
  logger,
  helper,
  formatError
) {
  this.browserCount = 0
  this.buildOk = false
  this.successfulBrowsers = []
  this.failedBrowsers = []
  this.onRunStart = function (browsers) {
    this.browserCount = browsers.length
    this.buildOk = true
    // Append to the existing list of successful browsers
    try {
      const browsers = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'successful-browsers.json'), 'utf8'))
      this.successfulBrowsers = browsers
    } catch (err) {
      // nothing
    }
  }
  this.onBrowserComplete = function (browser) {
    var results = browser.lastResult
    if (results.disconnected || results.error || results.failed) {
      this.buildOk = false
      this.failedBrowsers.push(browser)
    } else {
      if (browser.name.startsWith('HeadlessChrome')) {
        this.successfulBrowsers.push('ChromeHeadlessNoSandbox')
      } else if (browser.name.startsWith('Firefox')) {
        this.successfulBrowsers.push('FirefoxHeadless')
      } else if (browser.name.startsWith('Edge')) {
        this.successfulBrowsers.push('sl_edge')
      } else if (browser.name.startsWith('Mobile Safari')) {
        this.successfulBrowsers.push('sl_ios_safari')
      } else if (browser.name.startsWith('Chrome Mobile')) {
        this.successfulBrowsers.push('sl_android_chrome')
      } else if (browser.name.startsWith('Safari')) {
        this.successfulBrowsers.push('sl_safari')
      } else {
        console.log(JSON.stringify(browser, null, 2))
      }
    }
  }
  this.onRunComplete = function () {
    fs.writeFileSync(
      'successful-browsers.json',
      JSON.stringify(this.successfulBrowsers, null, 2),
      'utf8'
    )
  }
}

module.exports = BrowsersReporter
