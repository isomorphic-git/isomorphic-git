/* eslint-env node, browser, jasmine */
const { listNotes, removeNote } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('removeNote', () => {
  it('from default branch', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-removeNote')
    // Test
    let notes = await listNotes({
      fs,
      gitdir,
    })
    expect(notes.length).toBe(3)
    const oid = await removeNote({
      fs,
      gitdir,
      author: {
        name: 'William Hilton',
        email: 'wmhilton@gmail.com',
        timestamp: 1578937310,
        timezoneOffset: 300,
      },
      oid: '199948939a0b95c6f27668689102496574b2c332',
    })
    notes = await listNotes({
      fs,
      gitdir,
    })
    expect(notes.length).toBe(2)
    expect(oid).toBe('96cc0598c9f2eaac733d0817981039596c0c410f')
  })
  it('from alternate branch', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-removeNote')
    // Test
    let notes = await listNotes({
      fs,
      gitdir,
      ref: 'refs/notes/alt',
    })
    expect(notes.length).toBe(1)
    const oid = await removeNote({
      fs,
      gitdir,
      author: {
        name: 'William Hilton',
        email: 'wmhilton@gmail.com',
        timestamp: 1578937310,
        timezoneOffset: 300,
      },
      ref: 'refs/notes/alt',
      oid: 'f6d51b1f9a449079f6999be1fb249c359511f164',
    })
    notes = await listNotes({
      fs,
      gitdir,
      ref: 'refs/notes/alt',
    })
    expect(notes.length).toBe(0)
    expect(oid).toBe('cfab6e154843d83173626d8d39d1dbe0f603921b')
  })
})
