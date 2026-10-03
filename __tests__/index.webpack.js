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

// SW_PROBE_ONLY (see karma.conf.cjs) loads just the Service Worker probe spec,
// so the iOS-over-HTTPS diagnostic run is fast and free of mixed-content noise.
const onlyProbe = process.env.SW_PROBE_ONLY
for (const key of testsContext.keys()) {
  if (onlyProbe && !/test-sw-probe/.test(key)) continue
  testsContext(key)
}
