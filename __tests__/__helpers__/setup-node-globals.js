/* eslint-env browser */
/* eslint-disable no-var */
// Plain (non-webpack) script loaded by Karma *before* the test bundle — see the
// `files` list in karma.conf.cjs.
//
// Jest's `expect` pulls in `jest-util`, which ships PRE-BUNDLED (it carries its
// own nested webpack runtime) and eagerly runs `ci-info` / `preRunMessage` at
// module-load time, reading the Node globals `process` (and `Buffer`). Because
// those references live inside that pre-bundled blob, webpack's ProvidePlugin
// never rewrites them, so in a browser they throw `ReferenceError: process is
// not defined` before any test runs. Defining the globals here — ahead of the
// bundle — satisfies that load-time access. Only a tiny surface is used at load
// (process.env / process.platform / process.stdout.isTTY), but the shim is kept
// reasonably complete for matcher code paths that run later.
;(function () {
  if (typeof window.process === 'undefined') {
    // Deliberately a partial shim (only the surface Jest's deps touch at load);
    // cast through `any` since it doesn't implement the full NodeJS.Process type.
    window.process = /** @type {any} */ ({
      env: {},
      argv: [],
      platform: 'browser',
      browser: true,
      version: '',
      versions: {},
      nextTick: function (fn) {
        var args = Array.prototype.slice.call(arguments, 1)
        Promise.resolve().then(function () {
          fn.apply(null, args)
        })
      },
      emitWarning: function () {},
      cwd: function () {
        return '/'
      },
      chdir: function () {},
      on: function () {},
      once: function () {},
      off: function () {},
      addListener: function () {},
      removeListener: function () {},
      removeAllListeners: function () {},
      stdout: { write: function () {}, isTTY: false },
      stderr: { write: function () {}, isTTY: false },
    })
  }
})()
