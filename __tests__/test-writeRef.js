/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const snapshots = require('./__snapshots__/test-writeRef.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const { plugins, writeRef, resolveRef } = require('isomorphic-git')

describe('writeRef', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })
  it('writes a tag ref to HEAD', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-writeRef')
    plugins.set('fs', fs)
    // Test
    await writeRef({
      gitdir,
      ref: 'refs/tags/latest',
      value: 'cfc039a0acb68bee8bb4f3b13b6b211dbb8c1a69'
    })
    const ref = await resolveRef({ gitdir, ref: 'refs/tags/latest' })
    expect(ref).toMatchSnapshot()
  })
})
