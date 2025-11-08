// polyfill toMatchInlineSnapshot
require('./__helpers__/jasmine-inline-snapshots.js')

// polyfill AbortController for older browsers
require('./__helpers__/setup-abort-controller.js')

// require all modules in the current directory, but not subdirectories, matching with "/test-"
// @ts-ignore
const testsContext = require.context('.', false, /\/test-.*$/)

testsContext.keys().forEach(testsContext)

// Export to make this file a module for TypeScript
export {}
