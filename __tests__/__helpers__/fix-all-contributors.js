#! /usr/bin/env node
var replace = require('replace-in-file')
var options = {
  files: ['README.md'],
  from: /width="100px;"/g,
  to: `style="width: 60px; max-width: 60px"`
}
;(async function () {
  await replace(options)
})()
