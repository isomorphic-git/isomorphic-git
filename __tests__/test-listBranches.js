/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { listBranches } = require('isomorphic-git')

describe('listBranches', () => {
  it('listBranches', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-listBranches')
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
  it('remote', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-listBranches')
    // Test
    const commits = await listBranches({
      fs,
      gitdir,
      remote: 'origin'
    })
    expect(commits).toMatchInlineSnapshot(`
      Array [
        "HEAD",
        "master",
      ]
    `)
  })
})
