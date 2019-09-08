/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { fetch } = require('isomorphic-git')

describe('fetch (part 2)', () => {
  it('fetch --prune-tags from git-http-mock-server', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-fetch-client')
    expect(await fs.exists(`${gitdir}/refs/tags/v1.0.0-beta1`)).toBe(true)
    const oldValue = await fs.read(`${gitdir}/refs/tags/v1.0.0`, 'utf8')
    await fetch({
      dir,
      gitdir,
      depth: 1,
      tags: true,
      pruneTags: true
    })
    // assert that tag was deleted
    expect(await fs.exists(`${gitdir}/refs/tags/v1.0.0-beta1`)).toBe(false)
    // assert that tags was force-updated
    const newValue = await fs.read(`${gitdir}/refs/tags/v1.0.0`, 'utf8')
    expect(oldValue).not.toEqual(newValue)
  })
})
