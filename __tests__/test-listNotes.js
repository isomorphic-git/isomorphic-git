/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { listNotes, readBlob, resolveRef, readTree } = require('isomorphic-git')

// NOTE: These are mostly the `readObject` tests but in reverse
describe('listNotes', () => {
  it('from default branch', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-listNotes')
    // Test
    const notes = await listNotes({
      gitdir,
    })
    expect(notes.length).toBe(3)
    expect(notes).toEqual([
      {
        "oid": "0bd2dc08e06dafbcdfe1c97fc64a99d0f206ef78",
        "path": "199948939a0b95c6f27668689102496574b2c332",
      },
      {
        "oid": "6e2160d80f201db57a02415c47da5037ecc7c27f",
        "path": "68aba62e560c0ebc3396e8ae9335232cd93a3f60",
      },
      {
        "oid": "40f0ba45e23b41630eabae9f4fc8d5007e37fcd6",
        "path": "f6d51b1f9a449079f6999be1fb249c359511f164",
      }
    ])
  })
  it('from alternate branch', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-listNotes')
    // Test
    const notes = await listNotes({
      ref: 'refs/notes/alt',
      gitdir,
    })
    expect(notes.length).toBe(1)
    expect(notes).toEqual([
      {
        "oid": "73ec9c00618d8ebb2648c47c9b05d78227569728",
        "path": "f6d51b1f9a449079f6999be1fb249c359511f164",
      }
    ])
  })
})
