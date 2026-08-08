/* eslint-env jasmine */
import diff from 'diff-lines'
import { expect as jestExpect } from 'expect'
import prettyFormat from 'pretty-format'

function assertSnapshot(object, snapshot) {
  // Match Jest's inline-snapshot serialization (Jest >= 28 drops the `Object`/
  // `Array` prototype prefixes) so snapshots written for the Node/Jest run also
  // match in the browser/Jasmine run. Jest compares against the raw source of the
  // inline snapshot (with `\"`/`\\` escapes intact); here the snapshot argument
  // has already been un-escaped by the JS parser, so un-escape pretty-format's
  // output the same way before comparing.
  let actual = prettyFormat(object, { printBasicPrototype: false }).replace(
    /\\(["\\])/g,
    '$1'
  )
  if (snapshot.includes('\n')) {
    // we must unindent
    const match = snapshot.match(/^\n( *)/)
    if (match !== null) {
      const indent = match[1]
      snapshot = snapshot.replace(new RegExp(`\n${indent}`, 'g'), '\n')
    }
  }
  actual = actual.trim()
  snapshot = snapshot.trim()
  if (actual !== snapshot) {
    throw new Error(`Inline Snapshot Test failed:
${diff(actual, snapshot)}`)
  }
}

// Called explicitly from index.webpack.js (rather than as a side-effect-only
// import) because isomorphic-git's package.json sets "sideEffects": false, which
// makes webpack tree-shake side-effect-only imports.
//
// The browser tests run under Karma + Jasmine, but the test files were authored
// for Jest. Rather than re-implement Jest's matcher semantics on top of Jasmine
// (which drift subtly — e.g. Jasmine's `toThrow(/re/)` checks the thrown value for
// equality, not the message), we swap in Jest's own framework-agnostic matcher
// library (the `expect` package, same 30.x family as our pretty-format). Jasmine
// still provides the runner — describe/it/beforeAll and its own globals like
// `fail` — and only the global `expect` is replaced.
export function installJasmineSnapshots() {
  // Real Jest run (Node): it already has expect + toMatchInlineSnapshot + .skip.
  if (typeof jest !== 'undefined') return

  // Jasmine lacks the jest-style `.skip`/`.only` sub-functions; alias them to the
  // native x*/f* helpers so test files using `describe.skip` / `it.skip` load.
  if (typeof describe !== 'undefined') {
    if (typeof xdescribe !== 'undefined') describe.skip = xdescribe
    if (typeof fdescribe !== 'undefined') describe.only = fdescribe
  }
  if (typeof it !== 'undefined') {
    if (typeof xit !== 'undefined') it.skip = xit
    if (typeof fit !== 'undefined') it.only = fit
  }

  // `any` aliases: the `expect` package's types clash with the ambient
  // `@types/jest` globals (so `jestExpect` types as `void`), and `expect` isn't a
  // declared property of `globalThis`.
  /** @type {any} */
  const je = jestExpect
  /** @type {any} */
  const globalObj = globalThis

  // toMatchInlineSnapshot is a Jest snapshot matcher that rewrites the test's
  // *source file* with the received value. A real browser has no source file to
  // write back to, so we can only compare against the snapshot already inlined in
  // the source (auto-update is impossible here by nature — not a Jasmine quirk).
  // Registered on Jest's expect (persistent) rather than via jasmine.addMatchers
  // (which Jasmine clears after every spec).
  je.extend({
    toMatchInlineSnapshot(received, expected) {
      try {
        assertSnapshot(received, expected)
        return { pass: true, message: () => 'matched inline snapshot' }
      } catch (err) {
        return { pass: false, message: () => err.message }
      }
    },
  })

  // Replace Jasmine's global `expect` with Jest's. Jest's matchers throw a
  // JestAssertionError on failure, which Jasmine's spec runner catches and reports
  // as a failed spec.
  globalObj.expect = jestExpect
}

/**
 * Retry a flaky spec a few times before failing it. Real browsers and devices
 * occasionally hit transient timing failures in the shared ZenFS/BrowserStack
 * tunnel stack that have nothing to do with the code under test. Retrying just
 * the failing spec — each of which builds its own isolated fixture, so a retry
 * starts from a clean filesystem — is far cheaper and more targeted than
 * re-running the whole browser suite when a single spec is flaky.
 *
 * Only applies under Jasmine (browsers); Jest/Node runs are deterministic. Jest's
 * `expect` throws on failure, so a failed assertion — like any thrown error — is
 * caught here and retried.
 *
 * @param {number} [attempts=3] - Max attempts per spec.
 */
export function installSpecRetry(attempts = 3) {
  // Node/Jest: no retries (deterministic).
  if (typeof jest !== 'undefined') return
  /** @type {any} */
  const globalObj = globalThis
  const originalIt = globalObj.it
  if (typeof originalIt !== 'function' || originalIt.__retryWrapped) return

  const retryingIt = function (description, testFn, timeout) {
    // Only wrap async/zero-arg specs (all of ours). Pending specs (no fn) and
    // any done-callback style (fn.length > 0) are registered unchanged.
    if (typeof testFn !== 'function' || testFn.length > 0) {
      return originalIt(description, testFn, timeout)
    }
    return originalIt(
      description,
      async function () {
        let lastError
        for (let attempt = 1; attempt <= attempts; attempt++) {
          try {
            await testFn.call(this)
            return
          } catch (error) {
            lastError = error
            if (attempt < attempts) {
              // eslint-disable-next-line no-console
              console.warn(
                `Retrying flaky spec (attempt ${attempt + 1}/${attempts}): ${description}`
              )
            }
          }
        }
        throw lastError
      },
      timeout
    )
  }
  // Preserve `it.skip` / `it.only` and any other sub-helpers.
  Object.assign(retryingIt, originalIt)
  retryingIt.__retryWrapped = true
  globalObj.it = retryingIt
}
