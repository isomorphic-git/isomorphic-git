/* global describe it expect */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { listCommits } = process.browser
  ? require('../dist/internal.umd.min.js')
  : require('../dist/for-node/internal-apis')

describe('listCommits', () => {
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
    expect([...commits]).toMatchSnapshot()
  })
})
