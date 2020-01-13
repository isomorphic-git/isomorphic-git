/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { readNote } = require('isomorphic-git')

describe('readNote', () => {
  it('to a commit', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-readNote')
    // Test
    const note = await readNote({
      gitdir,
      oid: 'f6d51b1f9a449079f6999be1fb249c359511f164'
    })
    expect(note.toString('utf8')).toEqual('This is a note about a commit.\n')
  })
  it('to a tree', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-readNote')
    // Test
    const note = await readNote({
      gitdir,
      oid: '199948939a0b95c6f27668689102496574b2c332'
    })
    expect(note.toString('utf8')).toEqual('This is a note about a tree.\n')
  })
  it('to a blob', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-readNote')
    // Test
    const note = await readNote({
      gitdir,
      oid: '68aba62e560c0ebc3396e8ae9335232cd93a3f60'
    })
    expect(note.toString('utf8')).toEqual('This is a note about a blob.\n')
  })
  it('from an alternate branch', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-readNote')
    // Test
    const note = await readNote({
      gitdir,
      ref: 'refs/notes/alt',
      oid: 'f6d51b1f9a449079f6999be1fb249c359511f164'
    })
    expect(note.toString('utf8')).toEqual(
      'This is alternate note about a commit.\n'
    )
  })
})
