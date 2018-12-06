/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const snapshots = require('./__snapshots__/test-tag.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const { plugins, tag, resolveRef } = require('isomorphic-git')

describe('tag', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })
  it('creates a lightweight tag to HEAD', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-tag')
    plugins.set('fs', fs)
    // Test
    await tag({
      gitdir,
      name: 'latest'
    })
    const ref = await resolveRef({ gitdir, ref: 'refs/tags/latest' })
    expect(ref).toMatchSnapshot()
  })
})
