/* eslint-env node, browser, jasmine */
const path = require('path')

const {
  init,
  add,
  remove,
  commit,
  checkout,
  listFiles,
  readCommit,
  readTree,
} = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('unicode filepath support', () => {
  it('write/read index 日本語', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-unicode-paths')
    await init({ fs, dir, gitdir })
    // Test
    await add({ fs, dir, gitdir, filepath: '日本語' })
    expect((await listFiles({ fs, dir, gitdir }))[0]).toBe('日本語')
    await remove({ fs, dir, gitdir, filepath: '日本語' })
    expect((await listFiles({ fs, dir, gitdir })).length).toBe(0)
  })
  it('write/read index docs/日本語', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-unicode-paths')
    await init({ fs, dir, gitdir })
    // Test
    await fs.mkdir(path.join(dir, 'docs'))
    await fs.write(path.join(dir, 'docs/日本語'), '')
    await add({ fs, dir, gitdir, filepath: 'docs/日本語' })
    expect((await listFiles({ fs, dir, gitdir }))[0]).toBe('docs/日本語')
    await remove({ fs, dir, gitdir, filepath: 'docs/日本語' })
    expect((await listFiles({ fs, dir, gitdir })).length).toBe(0)
  })
  it('write/read commit 日本語', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-unicode-paths')
    await init({ fs, dir, gitdir })
    await add({ fs, dir, gitdir, filepath: '日本語' })
    // Test
    const sha = await commit({
      fs,
      dir,
      gitdir,
      author: {
        name: '日本語',
        email: '日本語@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
      message: '日本語',
    })
    // Check GitCommit object
    const { commit: comm } = await readCommit({ fs, dir, gitdir, oid: sha })
    expect(comm.author.name).toBe('日本語')
    expect(comm.author.email).toBe('日本語@example.com')
    expect(comm.message).toBe('日本語\n')
  })
  it('write/read tree 日本語', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-unicode-paths')
    await init({ fs, dir, gitdir })
    await add({ fs, dir, gitdir, filepath: '日本語' })
    const sha = await commit({
      fs,
      dir,
      gitdir,
      author: {
        name: '日本語',
        email: '日本語@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
      message: '日本語',
    })
    const { commit: comm } = await readCommit({ fs, dir, gitdir, oid: sha })
    // Test
    // Check GitTree object
    const { tree } = await readTree({
      fs,
      dir,
      gitdir,
      oid: comm.tree,
    })
    expect(tree[0].path).toBe('日本語')
  })
  it('checkout 日本語', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-unicode-paths')
    await init({ fs, dir, gitdir })
    await add({ fs, dir, gitdir, filepath: '日本語' })
    await commit({
      fs,
      dir,
      gitdir,
      author: {
        name: '日本語',
        email: '日本語@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
      message: '日本語',
    })
    await remove({ fs, dir, gitdir, filepath: '日本語' })
    // Test
    // Check GitIndex object
    await checkout({ fs, dir, gitdir, ref: 'HEAD' })
    expect((await listFiles({ fs, dir, gitdir }))[0]).toBe('日本語')
  })
  it('checkout docs/日本語', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-unicode-paths')
    await fs.mkdir(path.join(dir, 'docs'))
    await fs.write(path.join(dir, 'docs/日本語'), '')
    await init({ fs, dir, gitdir })
    await add({ fs, dir, gitdir, filepath: 'docs/日本語' })
    await commit({
      fs,
      dir,
      gitdir,
      author: {
        name: '日本語',
        email: '日本語@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
      message: '日本語',
    })
    await remove({ fs, dir, gitdir, filepath: 'docs/日本語' })
    // Test
    // Check GitIndex object
    await checkout({ fs, dir, gitdir, ref: 'HEAD' })
    expect((await listFiles({ fs, dir, gitdir }))[0]).toBe('docs/日本語')
  })
})
