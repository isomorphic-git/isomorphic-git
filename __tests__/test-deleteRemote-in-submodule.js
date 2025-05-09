/* eslint-env node, browser, jasmine */
const { Errors, deleteRemote, listRemotes } = require('isomorphic-git')

const {
  makeFixtureAsSubmodule,
} = require('./__helpers__/FixtureFSSubmodule.js')

describe('deleteRemote', () => {
  ;(process.browser ? xit : it)('deleteRemote', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixtureAsSubmodule(
      'test-deleteRemote'
    )
    const remote = 'foo'
    // Test
    await deleteRemote({ fs, dir, gitdir, remote })
    const a = await listRemotes({ fs, dir, gitdir })
    expect(a).toEqual([{ remote: 'bar', url: 'git@github.com:bar/bar.git' }])
  })
  ;(process.browser ? xit : it)('missing argument', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixtureAsSubmodule('test-addRemote')
    // Test
    let error = null
    try {
      // @ts-ignore
      await deleteRemote({ fs, dir, gitdir })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error instanceof Errors.MissingParameterError).toBe(true)
  })
})
