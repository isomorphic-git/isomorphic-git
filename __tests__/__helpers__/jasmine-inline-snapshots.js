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

// Jasmine lacks the jest-style `.skip`/`.only` sub-functions; alias them to the
// native x*/f* helpers so test files using `describe.skip` / `it.skip` load.
if (typeof jest === 'undefined') {
  if (typeof describe !== 'undefined') {
    if (typeof xdescribe !== 'undefined') describe.skip = xdescribe
    if (typeof fdescribe !== 'undefined') describe.only = fdescribe
  }
  if (typeof it !== 'undefined') {
    if (typeof xit !== 'undefined') it.skip = xit
    if (typeof fit !== 'undefined') it.only = fit
  }
}

// Jest has a toMatchInlineSnapshot() matcher built in, so we only
// need to run this polyfill if jest is undefined.
// NOTE: custom matchers must be registered in `beforeEach` — Jasmine clears them
// after every spec, so registering once in `beforeAll` leaves later specs without it.
if (typeof jest === 'undefined' && typeof jasmine !== 'undefined') {
  beforeEach(() => {
    jasmine.addMatchers({
      toMatchInlineSnapshot(_util, _customEqualityTesters) {
        return {
          compare(actual, expected) {
            try {
              assertSnapshot(actual, expected)
              return {
                pass: true,
                message: () => `matched inline snapshot`,
              }
            } catch (err) {
              return {
                pass: false,
                message: () => err.message,
              }
            }
          },
        }
      },
    })
  })
}
