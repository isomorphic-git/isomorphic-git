import commonConfig from './.config/jest.js'

export default {
  ...commonConfig(process.env.JEST_BROWSER || 'default-browser'),
  preset: 'jest-puppeteer',
}
