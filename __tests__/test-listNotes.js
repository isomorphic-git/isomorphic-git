/* eslint-env node, browser, jasmine */
const { listNotes } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('listNotes', () => {
  it('from default branch', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-listNotes')
    // Test
    const notes = await listNotes({
      fs,
      gitdir,
    })
    expect(notes.length).toBe(3)
    expect(notes).toEqual([
      {
        note: '0bd2dc08e06dafbcdfe1c97fc64a99d0f206ef78',
        target: '199948939a0b95c6f27668689102496574b2c332',
      },
      {
        note: '6e2160d80f201db57a02415c47da5037ecc7c27f',
        target: '68aba62e560c0ebc3396e8ae9335232cd93a3f60',
      },
      {
        note: '40f0ba45e23b41630eabae9f4fc8d5007e37fcd6',
        target: 'f6d51b1f9a449079f6999be1fb249c359511f164',
      },
    ])
  })
  it('from alternate branch', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-listNotes')
    // Test
    const notes = await listNotes({
      fs,
      gitdir,
      ref: 'refs/notes/alt',
    })
    expect(notes.length).toBe(1)
    expect(notes).toEqual([
      {
        note: '73ec9c00618d8ebb2648c47c9b05d78227569728',
        target: 'f6d51b1f9a449079f6999be1fb249c359511f164',
      },
    ])
  })
  it('from non-existant branch', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-listNotes')
    // Test
    const notes = await listNotes({
      fs,
      gitdir,
      ref: 'refs/notes/alt2',
    })
    expect(notes.length).toBe(0)
    expect(notes).toEqual([])
  })
})
