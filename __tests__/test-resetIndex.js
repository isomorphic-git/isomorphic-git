/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const { resetIndex, listFiles } = require('isomorphic-git')

describe('resetIndex', () => {
  it('modified', async () => {
    // Setup
    const { fs, gitdir, dir } = await makeFixture('test-resetIndex')
    // Test
    const before = await listFiles({ fs, gitdir })
    expect(before).toMatchInlineSnapshot(`
      Array [
        "a.txt",
        "b.txt",
        "d.txt",
      ]
    `)
    await resetIndex({ fs, dir, gitdir, filepath: 'a.txt' })
    const after = await listFiles({ fs, gitdir })
    expect(after).toMatchInlineSnapshot(`
      Array [
        "a.txt",
        "b.txt",
        "d.txt",
      ]
    `)
    expect(before.length === after.length).toBe(true)
  })
  it('new', async () => {
    // Setup
    const { fs, gitdir, dir } = await makeFixture('test-resetIndex')
    // Test
    const before = await listFiles({ fs, gitdir })
    expect(before).toMatchInlineSnapshot(`
      Array [
        "a.txt",
        "b.txt",
        "d.txt",
      ]
    `)
    await resetIndex({ fs, dir, gitdir, filepath: 'd.txt' })
    const after = await listFiles({ fs, gitdir })
    expect(after).toMatchInlineSnapshot(`
      Array [
        "a.txt",
        "b.txt",
      ]
    `)
    expect(before.length === after.length + 1).toBe(true)
  })
})
