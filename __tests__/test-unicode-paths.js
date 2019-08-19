/* eslint-env node, browser, jasmine */
const path = require('path')
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const {
  init,
  add,
  remove,
  commit,
  checkout,
  listFiles,
  readObject
} = require('isomorphic-git')

describe('unicode filepath support', () => {
  it('write/read index 日本語', async () => {
    // Setup
    const { core, dir, gitdir } = await makeFixture('test-unicode-paths')
    await init({ core, dir, gitdir })
    // Test
    await add({ core, dir, gitdir, filepath: '日本語' })
    expect((await listFiles({ core, dir, gitdir }))[0]).toBe('日本語')
    await remove({ core, dir, gitdir, filepath: '日本語' })
    expect((await listFiles({ core, dir, gitdir })).length).toBe(0)
  })
  it('write/read index docs/日本語', async () => {
    // Setup
    const { fs, core, dir, gitdir } = await makeFixture('test-unicode-paths')
    await init({ core, dir, gitdir })
    // Test
    await fs.mkdir(path.join(dir, 'docs'))
    await fs.write(path.join(dir, 'docs/日本語'), '')
    await add({ core, dir, gitdir, filepath: 'docs/日本語' })
    expect((await listFiles({ core, dir, gitdir }))[0]).toBe('docs/日本語')
    await remove({ core, dir, gitdir, filepath: 'docs/日本語' })
    expect((await listFiles({ core, dir, gitdir })).length).toBe(0)
  })
  it('write/read commit 日本語', async () => {
    // Setup
    const { core, dir, gitdir } = await makeFixture('test-unicode-paths')
    await init({ core, dir, gitdir })
    await add({ core, dir, gitdir, filepath: '日本語' })
    // Test
    const sha = await commit({
      core,
      dir,
      gitdir,
      author: {
        name: '日本語',
        email: '日本語@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0
      },
      message: '日本語'
    })
    // Check GitCommit object
    const { object: comm } = await readObject({ core, dir, gitdir, oid: sha })
    expect(comm.author.name).toBe('日本語')
    expect(comm.author.email).toBe('日本語@example.com')
    expect(comm.message).toBe('日本語\n')
  })
  it('write/read tree 日本語', async () => {
    // Setup
    const { core, dir, gitdir } = await makeFixture('test-unicode-paths')
    await init({ core, dir, gitdir })
    await add({ core, dir, gitdir, filepath: '日本語' })
    const sha = await commit({
      core,
      dir,
      gitdir,
      author: {
        name: '日本語',
        email: '日本語@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0
      },
      message: '日本語'
    })
    const { object: comm } = await readObject({ core, dir, gitdir, oid: sha })
    // Test
    // Check GitTree object
    const { object: tree } = await readObject({
      core,
      dir,
      gitdir,
      oid: comm.tree
    })
    expect(tree.entries[0].path).toBe('日本語')
  })
  it('checkout 日本語', async () => {
    // Setup
    const { core, dir, gitdir } = await makeFixture('test-unicode-paths')
    await init({ core, dir, gitdir })
    await add({ core, dir, gitdir, filepath: '日本語' })
    await commit({
      core,
      dir,
      gitdir,
      author: {
        name: '日本語',
        email: '日本語@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0
      },
      message: '日本語'
    })
    await remove({ core, dir, gitdir, filepath: '日本語' })
    // Test
    // Check GitIndex object
    await checkout({ core, dir, gitdir, ref: 'HEAD' })
    expect((await listFiles({ core, dir, gitdir }))[0]).toBe('日本語')
  })
  it('checkout docs/日本語', async () => {
    // Setup
    const { fs, core, dir, gitdir } = await makeFixture('test-unicode-paths')
    await fs.mkdir(path.join(dir, 'docs'))
    await fs.write(path.join(dir, 'docs/日本語'), '')
    await init({ core, dir, gitdir })
    await add({ core, dir, gitdir, filepath: 'docs/日本語' })
    await commit({
      core,
      dir,
      gitdir,
      author: {
        name: '日本語',
        email: '日本語@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0
      },
      message: '日本語'
    })
    await remove({ core, dir, gitdir, filepath: 'docs/日本語' })
    // Test
    // Check GitIndex object
    await checkout({ core, dir, gitdir, ref: 'HEAD' })
    expect((await listFiles({ core, dir, gitdir }))[0]).toBe('docs/日本語')
  })
})
