/* eslint-env node, browser, jasmine */
const {
  Errors,
  addNote,
  readBlob,
  resolveRef,
  readTree,
} = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('addNote', () => {
  it('to a commit', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-addNote')
    // Test
    const oid = await addNote({
      fs,
      gitdir,
      author: {
        name: 'William Hilton',
        email: 'wmhilton@gmail.com',
        timestamp: 1578937310,
        timezoneOffset: 300,
      },
      oid: 'f6d51b1f9a449079f6999be1fb249c359511f164',
      note: 'This is a note about a commit.',
    })
    const commit = await resolveRef({ fs, gitdir, ref: 'refs/notes/commits' })
    expect(commit).toEqual('3b4b7a6c2382ea60a0b4c7ff69920af9a2e6408d')
    expect(oid).toEqual('3b4b7a6c2382ea60a0b4c7ff69920af9a2e6408d')
    const { blob } = await readBlob({
      fs,
      gitdir,
      oid: '3b4b7a6c2382ea60a0b4c7ff69920af9a2e6408d',
      filepath: 'f6d51b1f9a449079f6999be1fb249c359511f164',
    })
    expect(Buffer.from(blob).toString('utf8')).toEqual(
      'This is a note about a commit.'
    )
  })
  it('to a tree', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-addNote')
    // Test
    const oid = await addNote({
      fs,
      gitdir,
      author: {
        name: 'William Hilton',
        email: 'wmhilton@gmail.com',
        timestamp: 1578937310,
        timezoneOffset: 300,
      },
      oid: '199948939a0b95c6f27668689102496574b2c332',
      note: 'This is a note about a tree.',
    })
    const commit = await resolveRef({ fs, gitdir, ref: 'refs/notes/commits' })
    expect(commit).toEqual('4b52ff827d2b5fe1786bf52a1b78dd25517b6cdd')
    expect(oid).toEqual('4b52ff827d2b5fe1786bf52a1b78dd25517b6cdd')
    const { blob } = await readBlob({
      fs,
      gitdir,
      oid: '4b52ff827d2b5fe1786bf52a1b78dd25517b6cdd',
      filepath: '199948939a0b95c6f27668689102496574b2c332',
    })
    expect(Buffer.from(blob).toString('utf8')).toEqual(
      'This is a note about a tree.'
    )
  })
  it('to a blob', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-addNote')
    // Test
    const oid = await addNote({
      fs,
      gitdir,
      author: {
        name: 'William Hilton',
        email: 'wmhilton@gmail.com',
        timestamp: 1578937310,
        timezoneOffset: 300,
      },
      oid: '68aba62e560c0ebc3396e8ae9335232cd93a3f60',
      note: 'This is a note about a blob.',
    })
    const commit = await resolveRef({ fs, gitdir, ref: 'refs/notes/commits' })
    expect(commit).toEqual('6428616e2600d3cd4b66059d5c561a85ce4b33ff')
    expect(oid).toEqual('6428616e2600d3cd4b66059d5c561a85ce4b33ff')
    const { blob } = await readBlob({
      fs,
      gitdir,
      oid: '6428616e2600d3cd4b66059d5c561a85ce4b33ff',
      filepath: '68aba62e560c0ebc3396e8ae9335232cd93a3f60',
    })
    expect(Buffer.from(blob).toString('utf8')).toEqual(
      'This is a note about a blob.'
    )
  })
  it('consecutive notes accumulate', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-addNote')
    // Test
    {
      const oid = await addNote({
        fs,
        gitdir,
        author: {
          name: 'William Hilton',
          email: 'wmhilton@gmail.com',
          timestamp: 1578937310,
          timezoneOffset: 300,
        },
        oid: 'f6d51b1f9a449079f6999be1fb249c359511f164',
        note: 'This is a note about a commit.',
      })
      const { tree } = await readTree({ fs, gitdir, oid })
      expect(tree.length).toBe(1)
    }
    {
      const oid = await addNote({
        fs,
        gitdir,
        author: {
          name: 'William Hilton',
          email: 'wmhilton@gmail.com',
          timestamp: 1578937310,
          timezoneOffset: 300,
        },
        oid: '199948939a0b95c6f27668689102496574b2c332',
        note: 'This is a note about a tree.',
      })
      const { tree } = await readTree({ fs, gitdir, oid })
      expect(tree.length).toBe(2)
    }
    {
      const oid = await addNote({
        fs,
        gitdir,
        author: {
          name: 'William Hilton',
          email: 'wmhilton@gmail.com',
          timestamp: 1578937310,
          timezoneOffset: 300,
        },
        oid: '68aba62e560c0ebc3396e8ae9335232cd93a3f60',
        note: 'This is a note about a blob.',
      })
      const { tree } = await readTree({ fs, gitdir, oid })
      expect(tree.length).toBe(3)
    }
  })
  it('can add a note to a different branch', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-addNote')
    // Test
    const oid = await addNote({
      fs,
      gitdir,
      ref: 'refs/notes/alt',
      author: {
        name: 'William Hilton',
        email: 'wmhilton@gmail.com',
        timestamp: 1578937310,
        timezoneOffset: 300,
      },
      oid: '68aba62e560c0ebc3396e8ae9335232cd93a3f60',
      note: 'This is a note about a blob.',
    })
    const commit = await resolveRef({ fs, gitdir, ref: 'refs/notes/alt' })
    expect(commit).toEqual('6428616e2600d3cd4b66059d5c561a85ce4b33ff')
    expect(oid).toEqual('6428616e2600d3cd4b66059d5c561a85ce4b33ff')
    const { blob } = await readBlob({
      fs,
      gitdir,
      oid: '6428616e2600d3cd4b66059d5c561a85ce4b33ff',
      filepath: '68aba62e560c0ebc3396e8ae9335232cd93a3f60',
    })
    expect(Buffer.from(blob).toString('utf8')).toEqual(
      'This is a note about a blob.'
    )
  })
  it('throws if note already exists', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-addNote')
    await addNote({
      fs,
      gitdir,
      author: {
        name: 'William Hilton',
        email: 'wmhilton@gmail.com',
        timestamp: 1578937310,
        timezoneOffset: 300,
      },
      oid: 'f6d51b1f9a449079f6999be1fb249c359511f164',
      note: 'This is a note about a commit.',
    })
    // Test
    let error = null
    try {
      await addNote({
        fs,
        gitdir,
        author: {
          name: 'William Hilton',
          email: 'wmhilton@gmail.com',
          timestamp: 1578937310,
          timezoneOffset: 300,
        },
        oid: 'f6d51b1f9a449079f6999be1fb249c359511f164',
        note: 'This is a note about a commit.',
      })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error instanceof Errors.AlreadyExistsError).toBe(true)
  })
  it('replaces existing note with --force', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-addNote')
    await addNote({
      fs,
      gitdir,
      author: {
        name: 'William Hilton',
        email: 'wmhilton@gmail.com',
        timestamp: 1578937310,
        timezoneOffset: 300,
      },
      oid: 'f6d51b1f9a449079f6999be1fb249c359511f164',
      note: 'This is a note about a commit.',
    })
    // Test
    const oid = await addNote({
      fs,
      gitdir,
      author: {
        name: 'William Hilton',
        email: 'wmhilton@gmail.com',
        timestamp: 1578937310,
        timezoneOffset: 300,
      },
      oid: 'f6d51b1f9a449079f6999be1fb249c359511f164',
      note: 'This is the newer note about a commit.',
      force: true,
    })
    const { blob } = await readBlob({
      fs,
      gitdir,
      oid,
      filepath: 'f6d51b1f9a449079f6999be1fb249c359511f164',
    })
    expect(Buffer.from(blob).toString('utf8')).toEqual(
      'This is the newer note about a commit.'
    )
  })
})
