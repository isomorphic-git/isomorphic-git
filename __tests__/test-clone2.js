/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { clone2 } = require('isomorphic-git')

// this is so it works with either Node local tests or Browser WAN tests
const localhost =
  typeof window === 'undefined' ? 'localhost' : window.location.hostname

describe('clone2', () => {
  it('clone with noCheckout', async () => {
    const { fs, dir, gitdir } = await makeFixture('isomorphic-git')
    let messageCount = 0
    let progressCount = 0
    await clone2({
      dir,
      gitdir,
      ref: 'test-branch',
      singleBranch: true,
      noCheckout: true,
      url: 'https://github.com/isomorphic-git/isomorphic-git',
      corsProxy: process.browser ? `http://${localhost}:9999` : undefined
    })
      .onMessage(() => messageCount++)
      .onProgress(() => progressCount++)
    expect(messageCount > 0).toBe(true)
    expect(progressCount > 0).toBe(true)
    expect(await fs.exists(`${dir}`)).toBe(true)
    expect(await fs.exists(`${gitdir}/objects`)).toBe(true)
    expect(await fs.exists(`${gitdir}/refs/remotes/origin/test-branch`)).toBe(
      true
    )
    expect(await fs.exists(`${gitdir}/refs/heads/test-branch`)).toBe(true)
    expect(await fs.exists(`${dir}/package.json`)).toBe(false)
  })
})
