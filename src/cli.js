#!/usr/bin/env node
import minimisted from 'minimisted'
import git from '.'

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
