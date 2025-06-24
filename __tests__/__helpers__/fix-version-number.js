#! /usr/bin/env node
import replace from 'replace-in-file'

import * as pkg from '../../package.json'
var options = {
  files: ['src/**/*.js'],
  from: /0\.0\.0-development/g,
  to: pkg.version,
}
;(async function() {
  // @ts-ignore
  await replace(options)
})()
