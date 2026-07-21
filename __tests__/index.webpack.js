// polyfill toMatchInlineSnapshot + jest-style describe.skip/it.skip.
// Called (not a bare side-effect import) so webpack does not tree-shake it.
import { installJasmineSnapshots } from './__helpers__/jasmine-inline-snapshots.js'
installJasmineSnapshots()

// Import all "test-*.js" modules in this directory (but not subdirectories).
// `import.meta.webpackContext` is the webpack 5 ESM-native equivalent of the
// old `require.context`, which cannot be used from an ES module.
// @ts-ignore - `webpackContext` is a webpack-specific extension of `import.meta`
const testsContext = import.meta.webpackContext('.', {
  recursive: false,
  regExp: /\/test-.*$/,
})

for (const key of testsContext.keys()) {
  testsContext(key)
}
