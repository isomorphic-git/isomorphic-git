/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const snapshots = require('./__snapshots__/test-writeRef.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const { plugins, writeRef, resolveRef, currentBranch } = require('isomorphic-git')

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
  it('sets current branch to another', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-writeRef')
    plugins.set('fs', fs)
    // Test
    await writeRef({
      gitdir,
      ref: 'refs/heads/another',
      value: 'HEAD'
    })
    await writeRef({
      gitdir,
      ref: 'HEAD',
      value: 'refs/heads/another',
      force: true,
      symbolic: true
    })
    const newBranch = await currentBranch({ gitdir, fullname: true })
    expect(newBranch).toBe('refs/heads/another')
    const ref = await resolveRef({ gitdir, ref: newBranch })
    expect(ref).toMatchSnapshot()
  })
})
