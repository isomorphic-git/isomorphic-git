export default {
  launch: {
    browser: process.env.JEST_BROWSER,
    product: process.env.JEST_BROWSER === 'firefox' ? 'firefox' : 'chrome',
    executablePath: process.env.JEST_BROWSER === 'firefox' ? '/usr/bin/firefox' : undefined,
    args: process.env.JEST_BROWSER === 'firefox' ? ['--headless', '--kiosk'] : ['--no-sandbox'],
    headless: true,
  },
}