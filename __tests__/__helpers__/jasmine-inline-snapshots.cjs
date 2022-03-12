/* eslint-env jasmine */
const diff = require('diff-lines')
const prettyFormat = require('pretty-format')

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

// Jest has a toMatchInlineSnapshot() matcher built in, so we only
// need to run this polyfill if jest is undefined.
if (typeof jest === 'undefined' && typeof jasmine !== 'undefined') {
  beforeAll(() => {
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
