// polyfill toMatchInlineSnapshot
require('./__helpers__/jasmine-inline-snapshots.js')

// require all modules in the current directory, but not subdirectories, matching with "/test-"
// @ts-ignore
const testsContext = require.context('.', false, /\/test-.*$/)

testsContext.keys().forEach(testsContext)
