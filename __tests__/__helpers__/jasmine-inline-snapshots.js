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

  // toMatchInlineSnapshot is a Jest snapshot matcher that rewrites the test's
  // *source file* with the received value. A real browser has no source file to
  // write back to, so we can only compare against the snapshot already inlined in
  // the source (auto-update is impossible here by nature — not a Jasmine quirk).
  // Registered on Jest's expect (persistent) rather than via jasmine.addMatchers
  // (which Jasmine clears after every spec).
  jestExpect.extend({
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
  globalThis.expect = jestExpect
}
