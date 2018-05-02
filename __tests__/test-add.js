/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { init, add, listFiles } = require('isomorphic-git')

describe('add', () => {
  it('file', async () => {
    // Setup
    let { fs, dir } = await makeFixture('test-add')
    // Test
    await init({ fs, dir })
    await add({ fs, dir, filepath: 'a.txt' })
    expect((await listFiles({ fs, dir })).length === 1).toBe(true)
    await add({ fs, dir, filepath: 'a.txt' })
    expect((await listFiles({ fs, dir })).length === 1).toBe(true)
    await add({ fs, dir, filepath: 'a-copy.txt' })
    expect((await listFiles({ fs, dir })).length === 2).toBe(true)
    await add({ fs, dir, filepath: 'b.txt' })
    expect((await listFiles({ fs, dir })).length === 3).toBe(true)
  })
})
