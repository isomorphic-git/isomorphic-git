/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
// @ts-ignore
const snapshots = require('./__snapshots__/test-listCommitsAndTags.js.snap')

const { listCommitsAndTags } = require('isomorphic-git/internal-apis')

describe('listCommitsAndTags', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })
  it('listCommitsAndTags', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-listCommitsAndTags')
    // Test
    const commits = await listCommitsAndTags({
      fs,
      gitdir,
      start: ['c60bbbe99e96578105c57c4b3f2b6ebdf863edbc'],
      finish: ['c77052f99c33dbe3d2a120805fcebe9e2194b6f9']
    })
    expect([...commits]).toMatchSnapshot()
  })
})
