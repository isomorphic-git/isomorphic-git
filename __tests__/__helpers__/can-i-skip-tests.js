#!/usr/bin/env node
const whitelist = process.argv.slice(2)
const { execSync } = require('child_process')

const result = execSync('git diff main --name-only', { encoding: 'utf8' })

const files = result.trim().split('\n')

console.log('Changed files:')
for (const file of files) {
  console.log(file)
  if (whitelist.indexOf(file.trim()) === -1) process.exit(1)
}
console.log('Skipping tests because all the changed files were whitelisted.')
