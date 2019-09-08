/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { E, fetch } = require('isomorphic-git')

describe('fetch (part 2)', () => {
  it('errors if missing refspec', async () => {
    const { gitdir } = await makeFixture('test-issue-84')
    // Test
    let err = null
    try {
      await fetch({
        gitdir,
        since: new Date(1506571200000),
        singleBranch: true,
        remote: 'origin',
        ref: 'test-branch-shallow-clone'
      })
    } catch (e) {
      err = e
    }
    expect(err).toBeDefined()
    expect(err.code).toEqual(E.NoRefspecConfiguredError)
  })

  it('fetch empty repository from git-http-mock-server', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-empty')
    await fetch({
      dir,
      gitdir,
      depth: 1,
      url: 'http://localhost:8888/test-empty.git'
    })
    expect(await fs.exists(`${dir}`)).toBe(true)
    expect(await fs.exists(`${gitdir}/HEAD`)).toBe(true)
    expect((await fs.read(`${gitdir}/HEAD`)).toString('utf-8').trim()).toEqual(
      'ref: refs/heads/master'
    )
    expect(await fs.exists(`${gitdir}/refs/heads/master`)).toBe(false)
  })

  it('fetch --prune from git-http-mock-server', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-fetch-client')
    expect(await fs.exists(`${gitdir}/refs/remotes/origin/test-prune`)).toBe(
      true
    )
    const { pruned } = await fetch({
      dir,
      gitdir,
      depth: 1,
      prune: true
    })
    expect(pruned).toEqual(['refs/remotes/origin/test-prune'])
    expect(await fs.exists(`${gitdir}/refs/remotes/origin/test-prune`)).toBe(
      false
    )
  })

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
