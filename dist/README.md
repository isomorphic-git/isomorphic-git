# [isomorphic-git](https://github.com/wmhilton/esgit)

These are the "distributable" versions i.e. what's installed by npm.
There are a few variations, you can pick which makes sense for your use case.

## for-node.js

This version uses CommonJS `require()` statements and syntax compatible with
the most version(s) of node listed in the `engines.node` field of `package.json`.

## for-browserify.js

This version (also) uses CommonJS `require()` statements but is transpiled with
`babel-preset-env` to target `'browsers': 'last 1 version'`.

## bundle.umd.min.js

This version is a UMD bundle suitable for throwing in a `<script>` tag without
any pre-processing. It has one global dependency: you must configure a BrowserFS instance
and make it available as `window.fs` or it won't work. If no module loader is
detected, it will attach itself to the global object as `window.git`.

## for-future.js

This is an pure ES2017+ module with only minimal transpilation. (I have to do
a little so the `rollup` parser doesn't error out.) It is basically the source
code, but tree-shaken and concatenated with some tinier dependencies inlined.
