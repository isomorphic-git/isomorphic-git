/* eslint-env browser, jasmine */

// The Web Crypto SubtleCrypto API (`crypto.subtle`) is only exposed in *secure
// contexts* — HTTPS or `localhost`. BrowserStack serves the tunneled local test
// server over `http://bs-local.com`, which is NOT a secure context, so
// `crypto.subtle` is `undefined` there and the PGP signing plugin cannot run
// (it throws `undefined is not an object (evaluating 'crypto.subtle.digest')`).
//
// Use this in place of `it` for tests that require Web Crypto so they are
// SKIPPED (not failed) when it is unavailable. In secure contexts (local
// ChromeHeadless on localhost, Node, or a browser served over HTTPS) they run
// normally.
export function itSecureContext(expectation, assertion, timeout) {
  const runner = typeof crypto !== 'undefined' && crypto.subtle ? it : it.skip
  return runner(expectation, assertion, timeout)
}
