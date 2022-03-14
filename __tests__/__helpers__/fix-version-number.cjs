#! /usr/bin/env node
var replace = require('replace-in-file')

var pkg = require('../../package.json')
var options = {
  files: ['src/**/*.js'],
  from: /0\.0\.0-development/g,
  to: pkg.version,
}
;(async function() {
  // @ts-ignore
  await replace(options)
})()
