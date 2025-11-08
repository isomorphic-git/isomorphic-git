export default {
  launch: {
    browser: process.env.JEST_BROWSER,
    args: ['--no-sandbox'],
	headless: true,
  },
}
