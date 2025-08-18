/* eslint-env node, browser, jasmine */
const { writeBlob } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('writeBlob', () => {
  it('empty blob', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-writeBlob')
    // Test
    const oid = await writeBlob({
      fs,
      gitdir,
      blob: new Uint8Array([]),
    })
    expect(oid).toEqual('e69de29bb2d1d6434b8b29ae775ad8c2e48c5391')
  })
  it('blob', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-writeBlob')
    // Test
    const oid = await writeBlob({
      fs,
      gitdir,
      blob: Buffer.from(
        `#!/usr/bin/env node
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
`,
        'utf8'
      ),
    })
    expect(oid).toEqual('4551a1856279dde6ae9d65862a1dff59a5f199d8')
  })
})
