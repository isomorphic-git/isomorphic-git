/* eslint-env node, browser, jasmine */
const { Errors, tag, resolveRef } = require('isomorphic-git')

const {
  makeFixtureAsSubmodule,
} = require('./__helpers__/FixtureFSSubmodule.js')

describe('tag', () => {
  ;(process.browser ? xit : it)(
    'creates a lightweight tag to HEAD',
    async () => {
      // Setup
      const { fs, gitdir } = await makeFixtureAsSubmodule('test-tag')
      // Test
      await tag({ fs, gitdir, ref: 'latest' })
      const ref = await resolveRef({ fs, gitdir, ref: 'refs/tags/latest' })
      expect(ref).toEqual('cfc039a0acb68bee8bb4f3b13b6b211dbb8c1a69')
    }
  )
  ;(process.browser ? xit : it)('fails if tag already exists', async () => {
    // Setup
    const { fs, gitdir } = await makeFixtureAsSubmodule('test-tag')
    // Test
    let error = null
    try {
      await tag({ fs, gitdir, ref: 'existing-tag' })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error instanceof Errors.AlreadyExistsError).toBe(true)
  })
  ;(process.browser ? xit : it)(
    'fails if tag already exists (packed)',
    async () => {
      // Setup
      const { fs, gitdir } = await makeFixtureAsSubmodule('test-tag')
      // Test
      let error = null
      try {
        await tag({ fs, gitdir, ref: 'packed-tag' })
      } catch (err) {
        error = err
      }
      expect(error).not.toBeNull()
      expect(error instanceof Errors.AlreadyExistsError).toBe(true)
    }
  )
  ;(process.browser ? xit : it)('force overwrite', async () => {
    // Setup
    const { fs, gitdir } = await makeFixtureAsSubmodule('test-tag')
    // Test
    let error = null
    try {
      await tag({ fs, gitdir, ref: 'existing-tag', force: true })
    } catch (err) {
      error = err
    }
    expect(error).toBeNull()
  })
  ;(process.browser ? xit : it)('force overwrite (packed)', async () => {
    // Setup
    const { fs, gitdir } = await makeFixtureAsSubmodule('test-tag')
    // Test
    let error = null
    try {
      await tag({ fs, gitdir, ref: 'packed-tag', force: true })
    } catch (err) {
      error = err
    }
    expect(error).toBeNull()
  })
})
