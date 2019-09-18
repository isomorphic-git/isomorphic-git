/* eslint-env node, browser, jasmine */

export const isSafariMobile11 = process.browser && /Version\/11\..*Mobile.*Safari/.test(navigator && navigator.userAgent)
