/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { addNote, readBlob, resolveRef, readTree } = require('isomorphic-git')

// NOTE: These are mostly the `readObject` tests but in reverse
describe('addNote', () => {
  it('to a commit', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-addNote')
    // Test
    const oid = await addNote({
      gitdir,
      author: {
        name: 'William Hilton',
        email: 'wmhilton@gmail.com',
        timestamp: 1578937310,
        timezoneOffset: 300
      },
      oid: 'f6d51b1f9a449079f6999be1fb249c359511f164',
      note: 'This is a note about a commit.'
    })
    const commit = await resolveRef({ gitdir, ref: 'refs/notes/commits' })
    expect(commit).toEqual('3b4b7a6c2382ea60a0b4c7ff69920af9a2e6408d')
    expect(oid).toEqual('3b4b7a6c2382ea60a0b4c7ff69920af9a2e6408d')
    let { blob } = await readBlob({
      gitdir,
      oid: '3b4b7a6c2382ea60a0b4c7ff69920af9a2e6408d',
      filepath: 'f6d51b1f9a449079f6999be1fb249c359511f164'
    })
    expect(blob.toString('utf8')).toEqual('This is a note about a commit.')
  })
  it('to a tree', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-addNote')
    // Test
    const oid = await addNote({
      gitdir,
      author: {
        name: 'William Hilton',
        email: 'wmhilton@gmail.com',
        timestamp: 1578937310,
        timezoneOffset: 300
      },
      oid: '199948939a0b95c6f27668689102496574b2c332',
      note: 'This is a note about a tree.'
    })
    const commit = await resolveRef({ gitdir, ref: 'refs/notes/commits' })
    expect(commit).toEqual('4b52ff827d2b5fe1786bf52a1b78dd25517b6cdd')
    expect(oid).toEqual('4b52ff827d2b5fe1786bf52a1b78dd25517b6cdd')
    let { blob } = await readBlob({
      gitdir,
      oid: '4b52ff827d2b5fe1786bf52a1b78dd25517b6cdd',
      filepath: '199948939a0b95c6f27668689102496574b2c332'
    })
    expect(blob.toString('utf8')).toEqual('This is a note about a tree.')
  })
  it('to a blob', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-addNote')
    // Test
    const oid = await addNote({
      gitdir,
      author: {
        name: 'William Hilton',
        email: 'wmhilton@gmail.com',
        timestamp: 1578937310,
        timezoneOffset: 300
      },
      oid: '68aba62e560c0ebc3396e8ae9335232cd93a3f60',
      note: 'This is a note about a blob.'
    })
    const commit = await resolveRef({ gitdir, ref: 'refs/notes/commits' })
    expect(commit).toEqual('6428616e2600d3cd4b66059d5c561a85ce4b33ff')
    expect(oid).toEqual('6428616e2600d3cd4b66059d5c561a85ce4b33ff')
    let { blob } = await readBlob({
      gitdir,
      oid: '6428616e2600d3cd4b66059d5c561a85ce4b33ff',
      filepath: '68aba62e560c0ebc3396e8ae9335232cd93a3f60'
    })
    expect(blob.toString('utf8')).toEqual('This is a note about a blob.')
  })
  it('consecutive notes accumulate', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-addNote')
    // Test
    {
      const oid = await addNote({
        gitdir,
        author: {
          name: 'William Hilton',
          email: 'wmhilton@gmail.com',
          timestamp: 1578937310,
          timezoneOffset: 300
        },
        oid: 'f6d51b1f9a449079f6999be1fb249c359511f164',
        note: 'This is a note about a commit.'
      })
      const { tree } = await readTree({ gitdir, oid })
      expect(tree.length).toBe(1)
    }
    {
      const oid = await addNote({
        gitdir,
        author: {
          name: 'William Hilton',
          email: 'wmhilton@gmail.com',
          timestamp: 1578937310,
          timezoneOffset: 300
        },
        oid: '199948939a0b95c6f27668689102496574b2c332',
        note: 'This is a note about a tree.'
      })
      const { tree } = await readTree({ gitdir, oid })
      expect(tree.length).toBe(2)
    }
    {
      const oid = await addNote({
        gitdir,
        author: {
          name: 'William Hilton',
          email: 'wmhilton@gmail.com',
          timestamp: 1578937310,
          timezoneOffset: 300
        },
        oid: '68aba62e560c0ebc3396e8ae9335232cd93a3f60',
        note: 'This is a note about a blob.'
      })
      const { tree } = await readTree({ gitdir, oid })
      expect(tree.length).toBe(3)
    }
  })
})
