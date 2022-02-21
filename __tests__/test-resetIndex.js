/* eslint-env node, browser, jasmine */
const { resetIndex, listFiles, statusMatrix } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

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
  it('new file', async () => {
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
  it('new repository', async () => {
    // Setup
    const { fs, gitdir, dir } = await makeFixture('test-resetIndex-new')
    // Test
    const before = await listFiles({ fs, gitdir })
    expect(before).toMatchInlineSnapshot(`
      Array [
        "a.txt",
        "b.txt",
      ]
    `)
    await resetIndex({ fs, dir, gitdir, filepath: 'b.txt' })
    const after = await listFiles({ fs, gitdir })
    expect(after).toMatchInlineSnapshot(`
      Array [
        "a.txt",
      ]
    `)
    expect(before.length === after.length + 1).toBe(true)
  })
  it('oid', async () => {
    // Setup
    const { fs, gitdir, dir } = await makeFixture('test-resetIndex-oid')
    // Test
    const before = await statusMatrix({ fs, dir, gitdir })
    expect(before).toMatchInlineSnapshot(`
      Array [
        Array [
          "a.txt",
          1,
          1,
          1,
        ],
        Array [
          "b.txt",
          1,
          1,
          1,
        ],
      ]
    `)
    await resetIndex({
      fs,
      dir,
      gitdir,
      filepath: 'b.txt',
      ref: '572d5ec8ea719ed6780ef0e6a115a75999cb3091',
    })
    const after = await statusMatrix({ fs, dir, gitdir })
    expect(after).toMatchInlineSnapshot(`
      Array [
        Array [
          "a.txt",
          1,
          1,
          1,
        ],
        Array [
          "b.txt",
          1,
          1,
          0,
        ],
      ]
    `)
  })
})
