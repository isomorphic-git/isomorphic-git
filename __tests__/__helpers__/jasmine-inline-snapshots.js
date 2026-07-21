/* eslint-env jasmine */
import diff from 'diff-lines'
import prettyFormat from 'pretty-format'

function assertSnapshot(object, snapshot) {
  let actual = prettyFormat(object)
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

// This is called explicitly from index.webpack.js (rather than relying on a
// side-effect-only import) because isomorphic-git's package.json sets
// "sideEffects": false, which makes webpack tree-shake side-effect-only imports.
export function installJasmineSnapshots() {
  // Jest has a built-in toMatchInlineSnapshot() and .skip/.only helpers.
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

  // Register the toMatchInlineSnapshot matcher. Jasmine clears custom matchers
  // after every spec, so this must run in `beforeEach`, not `beforeAll`.
  if (typeof jasmine !== 'undefined') {
    beforeEach(() => {
      jasmine.addMatchers({
        toMatchInlineSnapshot() {
          return {
            compare(actual, expected) {
              try {
                assertSnapshot(actual, expected)
                return { pass: true, message: 'matched inline snapshot' }
              } catch (err) {
                return { pass: false, message: err.message }
              }
            },
          }
        },
      })
    })
  }
}
