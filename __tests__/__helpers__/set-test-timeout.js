/* eslint-env node, browser, jest, jasmine */
export default function setTestTimeout(n) {
  if (typeof jest !== 'undefined') {
    jest.setTimeout(n)
  }
  if (typeof jasmine !== 'undefined') {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = n
  }
}
