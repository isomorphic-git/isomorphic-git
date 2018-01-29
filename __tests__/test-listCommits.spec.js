/* global describe it expect */
const { expectjs, registerSnapshots } = require('jasmine-snapshot')
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const { listCommits } = require('../dist/internal.umd.min.js')

describe('listCommits', () => {
  beforeAll(() => {
    registerSnapshots(require('./test-listCommits.snap'), 'listCommits')
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
    expectjs(commits).toMatchSnapshot()
  })
})
