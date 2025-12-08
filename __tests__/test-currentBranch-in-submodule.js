/* eslint-env node, browser, jasmine */
import { currentBranch } from 'isomorphic-git'

import { makeFixtureAsSubmodule } from './__helpers__/FixtureFSSubmodule.js'

describe('currentBranch', () => {
  it('resolve HEAD to master', async () => {
    // Setup
    const { fs, gitdir } = await makeFixtureAsSubmodule('test-resolveRef')
    // Test
    const branch = await currentBranch({ fs, gitdir })
    expect(branch).toEqual('master')
  })
  it('resolve HEAD to refs/heads/master', async () => {
    // Setup
    const { fs, gitdir } = await makeFixtureAsSubmodule('test-resolveRef')
    // Test
    const branch = await currentBranch({
      fs,
      gitdir,
      fullname: true,
    })
    expect(branch).toEqual('refs/heads/master')
  })
  it('returns undefined if HEAD is detached', async () => {
    // Setup
    const { fs, gitdir } = await makeFixtureAsSubmodule('test-detachedHead')
    // Test
    const branch = await currentBranch({ fs, gitdir })
    expect(branch).toBeUndefined()
  })
})
