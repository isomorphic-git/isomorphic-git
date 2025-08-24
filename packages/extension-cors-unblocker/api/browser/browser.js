// In Chrome, it resolves to a browser.* namespace as an wrapped alias for chrome.*.
// In Firefox/Safari, the browser.* namespace already exists, so it resolves to that.

// Note: Safari and FireFox do implement this compat shim.
export const isExtension = globalThis.chrome && globalThis.chrome.runtime && globalThis.chrome.runtime.id;
export const isFirefox = globalThis.browser && globalThis.browser.runtime && globalThis.browser.runtime.id;
export const isChrome = isExtension && !isFirefox;
export const browserPromise = !isExtension ? Promise.reject("This should only run in a Browser Extension") : isChrome ? import('./mozilla-browser-polyfill.js') : Promise.resolve(globalThis.browser);
