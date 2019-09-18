/* eslint-env node, browser, jasmine */

export const isSafariMobile11 = process.browser && /Version\/11\.*Safari.*Mobile/.test(navigator && navigator.userAgent)
