export default {
  launch: {
    browser: process.env.JEST_BROWSER,
    product: process.env.JEST_BROWSER === 'firefox' ? 'firefox' : 'chrome',
    args: process.env.JEST_BROWSER === 'firefox' ? [] : ['--no-sandbox'],
    headless: true,
  },
}