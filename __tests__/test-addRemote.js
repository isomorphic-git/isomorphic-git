/* eslint-env node, browser, jasmine */
const { Errors, addRemote, listRemotes } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('addRemote', () => {
  it('addRemote', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-addRemote')
    const remote = 'baz'
    const url = 'git@github.com:baz/baz.git'
    // Test
    await addRemote({ fs, dir, gitdir, remote, url })
    const a = await listRemotes({ fs, dir, gitdir })
    expect(a).toEqual([
      { remote: 'foo', url: 'git@github.com:foo/foo.git' },
      { remote: 'bar', url: 'git@github.com:bar/bar.git' },
      { remote: 'baz', url: 'git@github.com:baz/baz.git' },
    ])
  })
  it('missing argument', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-addRemote')
    const remote = 'baz'
    const url = undefined
    // Test
    let error = null
    try {
      await addRemote({ fs, dir, gitdir, remote, url })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error instanceof Errors.MissingParameterError).toBe(true)
  })
  it('invalid remote name', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-addRemote')
    const remote = '@{HEAD~1}'
    const url = 'git@github.com:baz/baz.git'
    // Test
    let error = null
    try {
      await addRemote({ fs, dir, gitdir, remote, url })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error instanceof Errors.InvalidRefNameError).toBe(true)
  })
})
