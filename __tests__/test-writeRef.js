/* eslint-env node, browser, jasmine */
const { writeRef, resolveRef, currentBranch } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('writeRef', () => {
  it('writes a tag ref to HEAD', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-writeRef')
    // Test
    await writeRef({
      fs,
      gitdir,
      ref: 'refs/tags/latest',
      value: 'cfc039a0acb68bee8bb4f3b13b6b211dbb8c1a69',
    })
    const ref = await resolveRef({ fs, gitdir, ref: 'refs/tags/latest' })
    expect(ref).toBe('cfc039a0acb68bee8bb4f3b13b6b211dbb8c1a69')
  })
  it('sets current branch to another', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-writeRef')
    // Test
    await writeRef({
      fs,
      gitdir,
      ref: 'refs/heads/another',
      value: 'HEAD',
    })
    await writeRef({
      fs,
      gitdir,
      ref: 'HEAD',
      value: 'refs/heads/another',
      force: true,
      symbolic: true,
    })
    const newBranch = await currentBranch({ fs, gitdir, fullname: true })
    expect(newBranch).toBe('refs/heads/another')
    if (!newBranch) throw new Error('type error')
    const ref = await resolveRef({ fs, gitdir, ref: newBranch })
    expect(ref).toBe('cfc039a0acb68bee8bb4f3b13b6b211dbb8c1a69')
  })
})
