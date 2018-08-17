/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { plugins, init, add, listFiles } = require('isomorphic-git')

describe('add', () => {
  it('file', async () => {
    // Setup
    let { fs, dir } = await makeFixture('test-add')
    plugins.set('fs', fs)
    // Test
    await init({ dir })
    await add({ dir, filepath: 'a.txt' })
    expect((await listFiles({ dir })).length === 1).toBe(true)
    await add({ dir, filepath: 'a.txt' })
    expect((await listFiles({ dir })).length === 1).toBe(true)
    await add({ dir, filepath: 'a-copy.txt' })
    expect((await listFiles({ dir })).length === 2).toBe(true)
    await add({ dir, filepath: 'b.txt' })
    expect((await listFiles({ dir })).length === 3).toBe(true)
  })
  it('non-existant file', async () => {
    // Setup
    let { fs, dir } = await makeFixture('test-add')
    plugins.set('fs', fs)
    // Test
    await init({ dir })
    let err = null
    try {
      await add({ dir, filepath: 'asdf.txt' })
    } catch (e) {
      err = e
    }
    expect(err.caller).toEqual('git.add')
  })
})
