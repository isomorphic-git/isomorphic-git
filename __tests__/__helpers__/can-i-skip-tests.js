#!/usr/bin/env node
var whitelist = process.argv.slice(2)
var { execSync } = require('child_process')

var result = execSync('git diff main --name-only', { encoding: 'utf8' })

var files = result.trim().split('\n')

console.log('Changed files:')
for (var file of files) {
  console.log(file)
  if (whitelist.indexOf(file.trim()) === -1) process.exit(1)
}
console.log('Skipping tests because all the changed files were whitelisted.')
