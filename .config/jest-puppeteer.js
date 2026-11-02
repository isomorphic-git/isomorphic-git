export default {
  launch: {
    browser: process.env.JEST_BROWSER,
    args: process.env.JEST_BROWSER === 'firefox' ? [] : ['--no-sandbox'],
    headless: true,
  },
}