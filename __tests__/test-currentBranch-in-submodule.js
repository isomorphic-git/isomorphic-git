/* eslint-env node, browser, jasmine */
const { currentBranch } = require('isomorphic-git')

// const { makeFixtureAsSubmodule } = require('./__helpers__/FixtureFSSubmodule.js')
const {
  makeFixtureAsSubmodule,
} = require('./__helpers__/FixtureFSSubmodule.js')

describe('currentBranch', () => {
  ;(process.browser ? xit : it)('resolve HEAD to master', async () => {
    // Setup
    const { fs, gitdir } = await makeFixtureAsSubmodule('test-resolveRef')
    // Test
    const branch = await currentBranch({ fs, gitdir })
    expect(branch).toEqual('master')
  })
  ;(process.browser ? xit : it)(
    'resolve HEAD to refs/heads/master',
    async () => {
      // Setup
      const { fs, gitdir } = await makeFixtureAsSubmodule('test-resolveRef')
      // Test
      const branch = await currentBranch({
        fs,
        gitdir,
        fullname: true,
      })
      expect(branch).toEqual('refs/heads/master')
    }
  )
  ;(process.browser ? xit : it)(
    'returns undefined if HEAD is detached',
    async () => {
      // Setup
      const { fs, gitdir } = await makeFixtureAsSubmodule('test-detachedHead')
      // Test
      const branch = await currentBranch({ fs, gitdir })
      expect(branch).toBeUndefined()
    }
  )
})
