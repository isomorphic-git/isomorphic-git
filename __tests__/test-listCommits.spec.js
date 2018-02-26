/* global describe it expect */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const snapshots = require('./__snapshots__/test-listCommits.js.snap')

const { listCommits } = require('isomorphic-git/internal-apis')

describe('listCommits', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })
  it('listCommits', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-listCommits')
    // Test
    let commits = await listCommits({
      fs,
      gitdir,
      start: ['c60bbbe99e96578105c57c4b3f2b6ebdf863edbc'],
      finish: ['c77052f99c33dbe3d2a120805fcebe9e2194b6f9']
    })
    expect([...commits]).toMatchSnapshot2()
  })
})
