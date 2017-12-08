#!/usr/bin/env node
const fs = require('fs')
const minimisted = require('minimisted')
const git = require('.')

// This really isn't much of a CLI. It's mostly for testing.
// But it's very versatile and works surprisingly well.

minimisted(async function ({ _: [command, ...args], ...opts }) {
  // Create the repo object
  const repo = new git.Git({ fs, dir: '.' })
  // What's the command?
  let cmd = `git.${command}(repo, ${JSON.stringify(opts)})`
  // for (let key of Object.keys(opts)) {
  //   // This is how you check for an array, right?
  //   if (opts[key].length === undefined) {
  //     repo[key](opts[key])
  //     cmd += `.${key}('${opts[key]}')`
  //   } else {
  //     repo[key](...opts[key])
  //     cmd += `.${key}(${opts[key].map(x => `'${x}'`).join(', ')})`
  //   }
  // }
  // cmd += `.${command}(${args.map(x => `'${x}'`).join(', ')})`
  console.log(repo)
  console.log(cmd)
  console.log(git)
  let result = await git[command](repo, opts)
  if (result === undefined) return
  console.log(JSON.stringify(result, null, 2))
})
