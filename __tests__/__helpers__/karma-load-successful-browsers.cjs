const fs = require('fs')
const path = require('path')

const translateBrowser = require('./karma-translate-browser.cjs')

module.exports = {
  load() {
    // Append to the existing list of successful browsers
    try {
      const browsers = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'browser-tests.json'), 'utf8')
      )
      return [browsers, browsers.map(translateBrowser)]
    } catch (err) {
      // file wasn't there, so don't worry
      return [[], []]
    }
  },
  filter(browsers) {
    const [, successfulBrowsers] = module.exports.load()
    console.log('skipping browsers:', successfulBrowsers)
    const newbrowsers = browsers.filter(b => !successfulBrowsers.includes(b))

    if (newbrowsers.length === 0) {
      console.log(
        'All browsers already passed test suite. Deleting ./browser-tests.json'
      )
      fs.unlinkSync(path.join(process.cwd(), 'browser-tests.json'))
      process.exit(0)
    }
    return newbrowsers
  },
  save(successfulBrowsersFullNames) {
    fs.writeFileSync(
      path.join(process.cwd(), 'browser-tests.json'),
      JSON.stringify(successfulBrowsersFullNames, null, 2),
      'utf8'
    )
  },
}
