/* eslint-env node, browser, jasmine */
const { listBranches } = require('isomorphic-git')

const {
  makeFixtureAsSubmodule,
} = require('./__helpers__/FixtureFSSubmodule.js')

describe('listBranches', () => {
  ;(process.browser ? xit : it)('listBranches', async () => {
    // Setup
    const { fs, gitdir } = await makeFixtureAsSubmodule('test-listBranches')
    // Test
    const commits = await listBranches({ fs, gitdir })
    expect(commits).toMatchInlineSnapshot(`
      Array [
        "feature/supercool",
        "greenkeeper/initial",
        "master",
        "test-branch",
      ]
    `)
  })
  ;(process.browser ? xit : it)('remote', async () => {
    // Setup
    const { fs, gitdir } = await makeFixtureAsSubmodule('test-listBranches')
    // Test
    const commits = await listBranches({
      fs,
      gitdir,
      remote: 'origin',
    })
    expect(commits).toMatchInlineSnapshot(`
      Array [
        "HEAD",
        "master",
      ]
    `)
  })
})
