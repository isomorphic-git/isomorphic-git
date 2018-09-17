#!/usr/bin/env node
const fs = require('fs')
const minimisted = require('minimisted')
const git = require('.')

// This really isn't much of a CLI. It's mostly for testing.
// But it's very versatile and works surprisingly well.

minimisted(async function ({ _: [command, ...args], ...opts }) {
  try {
    let result = await git[command](Object.assign({ fs, dir: '.' }, opts))
    if (result === undefined) return
    // detect streams
    if (typeof result.on === 'function') {
      result.pipe(process.stdout)
    } else {
      console.log(JSON.stringify(result, null, 2))
    }
  } catch (err) {
    process.stderr.write(err.message + '\n')
    console.log(err)
    process.exit(1)
  }
})
