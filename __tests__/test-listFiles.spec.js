/* global describe it expect */
const { expectjs, registerSnapshots } = require('jasmine-snapshot')
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const { listFiles } = require('..')

describe('listFiles', () => {
  beforeAll(() => {
    registerSnapshots(require('./test-listFiles.snap'), 'listFiles')
  })
  it('listFiles', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-listFiles')
    // Test
    const files = await listFiles({ fs, gitdir })
    expectjs(files).toMatchSnapshot()
  })
})
