/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
// @ts-ignore
const snapshots = require('./__snapshots__/test-readTag.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')

const { readTag } = require('isomorphic-git')

describe('readTag', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })
  it('annotated tag', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-readTag')
    // Test
    const tag = await readTag({
      gitdir,
      oid: '587d3f8290b513e2ee85ecd317e6efecd545aee6'
    })
    expect(tag).toMatchSnapshot()
  })
})
