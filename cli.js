#!/usr/bin/env node
const minimisted = require('minimisted')
const git = require('.')

// This really isn't much of a CLI. It's mostly for testing.
// But it's very versatile and works surprisingly well.

minimisted(async function ({ _: [command, ...args], ...opts }) {
  const dir = process.cwd()
  const repo = git(dir)
  let cmd = `git('${dir}')`
  for (let key of Object.keys(opts)) {
    // This is how you check for an array, right?
    if (opts[key].length === undefined) {
      repo[key](opts[key])
      cmd += `.${key}('${opts[key]}')`
    } else {
      repo[key](...opts[key])
      cmd += `.${key}(${opts[key].map(x => `'${x}'`).join(', ')})`
    }
  }
  cmd += `.${command}(${args.map(x => `'${x}'`).join(', ')})`
  console.log(cmd)
  let result = await repo[command](...args)
  console.log(result)
})
