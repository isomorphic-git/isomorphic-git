/* eslint-env node, browser, jasmine */
import { listBranches } from 'isomorphic-git'

import { makeFixtureAsSubmodule } from './__helpers__/FixtureFSSubmodule.js'

describe('listBranches', () => {
  it('listBranches', async () => {
    // Setup
    const { fs, gitdir } = await makeFixtureAsSubmodule('test-listBranches')
    // Test
    const commits = await listBranches({ fs, gitdir })
    expect(commits).toMatchInlineSnapshot(`
      [
        "feature/supercool",
        "greenkeeper/initial",
        "master",
        "test-branch",
      ]
    `)
  })
  it('remote', async () => {
    // Setup
    const { fs, gitdir } = await makeFixtureAsSubmodule('test-listBranches')
    // Test
    const commits = await listBranches({
      fs,
      gitdir,
      remote: 'origin',
    })
    expect(commits).toMatchInlineSnapshot(`
      [
        "HEAD",
        "master",
      ]
    `)
  })
})
