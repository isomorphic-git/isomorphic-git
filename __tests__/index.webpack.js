// polyfill toMatchInlineSnapshot + jest-style describe.skip/it.skip, and wrap
// `it` so flaky browser specs retry themselves (per-spec, not per-browser).
// Called (not bare side-effect imports) so webpack does not tree-shake them.
import {
  installJasmineSnapshots,
  installLockReset,
  installSpecRetry,
} from './__helpers__/jasmine-inline-snapshots.js'
installJasmineSnapshots()
// Must run before any spec is registered so `it` is wrapped when tests load.
installSpecRetry()
// Reset iso-git's shared file lock before each spec so a stalled op can't
// cascade 60s timeouts into later specs sharing a fixture path.
installLockReset()

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
