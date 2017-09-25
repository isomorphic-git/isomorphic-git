#!/usr/bin/env node
const minimisted = require('minimisted')
const git = require('.')

// This really isn't much of a CLI. It's mostly for testing.
// But it's very versatile and works surprisingly well.

minimisted(async function ({ _: [command, arg, ...args], ...opts }) {
  const dir = process.cwd()
  const repo = git(dir)
  let cmd = `git('${dir}')`
  for (let key of Object.keys(opts)) {
    repo[key](opts[key])
    cmd += `.${key}('${opts[key]}')`
  }
  cmd += `.${command}(${arg ? `'${arg}'` : ''})`
  console.log(cmd)
  let result = await repo[command](arg)
  console.log(result)
})
