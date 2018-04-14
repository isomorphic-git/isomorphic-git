#! /usr/bin/env node
// forked from https://github.com/jvilk/BrowserFS/blob/master/scripts/make_http_index.ts
var path = require('path')
var pkg = require('../../package.json')
var replace = require('replace-in-file')
var options = {
  files: ['src/**/*.js'],
  from: /0\.0\.0-development/g,
  to: pkg.version
}
;(async function () {
  await replace(options)
})()
