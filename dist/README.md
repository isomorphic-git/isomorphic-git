# [isomorphic-git](https://github.com/wmhilton/esgit)

These are the "distributable" versions i.e. what's installed by npm.
There are a few variations, you can pick which makes sense for your use case.

## for-browserify

This version uses CommonJS `require()` statements but is transpiled with
`babel-preset-env` to target `'browsers': 'last 1 version'`.

## for-future

This is an pure ES2017+ module with only minimal transpilation. (I have to do
a little so the `rollup` parser doesn't error out.) It is basically the source
code, but tree-shaken and concatenated with some tinier dependencies inlined.

## for-node

This version uses CommonJS `require()` statements and syntax compatible with
the version(s) of node listed in the `engines.node` field of `package.json`.

## bundle.umd.min.js

This version is a UMD bundle suitable for throwing in a `<script>` tag without
any pre-processing. It has one global dependency: you must configure a BrowserFS instance
and make it available as `window.fs` or it won't work. If no module loader is
detected, it will attach itself to the global object as `window.git`.
