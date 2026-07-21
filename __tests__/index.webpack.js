// polyfill toMatchInlineSnapshot
import './__helpers__/jasmine-inline-snapshots.js'

// Import all "test-*.js" modules in this directory (but not subdirectories).
// `import.meta.webpackContext` is the webpack 5 ESM-native equivalent of the
// old `require.context`, which cannot be used from an ES module.
const testsContext = import.meta.webpackContext('.', {
  recursive: false,
  regExp: /\/test-.*$/,
})

for (const key of testsContext.keys()) {
  testsContext(key)
}
