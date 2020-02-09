#! /usr/bin/env node
var pkg = require('../../package.json')
var replace = require('replace-in-file')
var options = {
  files: ['src/**/*.js'],
  from: /0\.0\.0-development/g,
  to: pkg.version
}
;(async function () {
  // @ts-ignore
  await replace(options)
})()
