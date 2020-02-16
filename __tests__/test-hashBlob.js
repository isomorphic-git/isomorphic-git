/* eslint-env node, browser, jasmine */

const { hashBlob } = require('isomorphic-git')

const string = `#!/usr/bin/env node
const minimisted = require('minimisted')
const git = require('.')

// This really isn't much of a CLI. It's mostly for testing.
// But it's very versatile and works surprisingly well.

minimisted(async function ({ _: [command, ...args], ...opts }) {
  const dir = process.cwd()
  const repo = git(dir)
  let cmd = \`git('\${dir}')\`
  for (let key of Object.keys(opts)) {
    // This is how you check for an array, right?
    if (opts[key].length === undefined) {
      repo[key](opts[key])
      cmd += \`.\${key}('\${opts[key]}')\`
    } else {
      repo[key](...opts[key])
      cmd += \`.\${key}(\${opts[key].map(x => \`'\${x}'\`).join(', ')})\`
    }
  }
  cmd += \`.\${command}(\${args.map(x => \`'\${x}'\`).join(', ')})\`
  console.log(cmd)
  let result = await repo[command](...args)
  if (result === undefined) return
  console.log(JSON.stringify(result, null, 2))
})
`

const buffer = Buffer.from(string, 'utf8')

const wrapped = Buffer.concat([
  Buffer.from(`blob ${buffer.byteLength}\x00`),
  buffer,
])

describe('hashBlob', () => {
  it('object as Uint8Array', async () => {
    // Test
    const { oid, object, format } = await hashBlob({
      object: buffer,
    })
    expect(oid).toEqual('4551a1856279dde6ae9d65862a1dff59a5f199d8')
    expect(format).toEqual('wrapped')
    expect(Buffer.compare(Buffer.from(object), wrapped) === 0).toBe(true)
  })

  it('object as String', async () => {
    // Test
    const { oid, object, format } = await hashBlob({
      object: string,
    })
    expect(oid).toEqual('4551a1856279dde6ae9d65862a1dff59a5f199d8')
    expect(format).toEqual('wrapped')
    expect(Buffer.compare(Buffer.from(object), wrapped) === 0).toBe(true)
  })
})
