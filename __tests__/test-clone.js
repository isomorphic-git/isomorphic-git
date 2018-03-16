/* globals describe it expect */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { clone } = require('isomorphic-git')

describe('clone', () => {
  it('clone', async () => {
    let { fs, dir, gitdir } = await makeFixture('isomorphic-git')
    let url = `https://${
      process.browser ? 'cors-buster-jfpactjnem.now.sh/' : ''
    }github.com/isomorphic-git/isomorphic-git`
    await clone({
      fs,
      dir,
      gitdir,
      depth: 1,
      ref: 'test-branch',
      url
    })
    expect(fs.existsSync(`${dir}`)).toBe(true)
    expect(fs.existsSync(`${gitdir}/objects`)).toBe(true)
    expect(fs.existsSync(`${gitdir}/refs/remotes/origin/test-branch`)).toBe(
      true
    )
    expect(fs.existsSync(`${gitdir}/refs/heads/test-branch`)).toBe(true)
    expect(fs.existsSync(`${dir}/package.json`)).toBe(true)
  })
  it('clone a tag', async () => {
    let { fs, dir, gitdir } = await makeFixture('isomorphic-git')
    let url = `https://${
      process.browser ? 'cors-buster-jfpactjnem.now.sh/' : ''
    }github.com/isomorphic-git/isomorphic-git`
    await clone({
      fs,
      dir,
      gitdir,
      depth: 1,
      singleBranch: true,
      ref: 'test-tag',
      url
    })
    expect(fs.existsSync(`${dir}`)).toBe(true)
    expect(fs.existsSync(`${gitdir}/objects`)).toBe(true)
    expect(fs.existsSync(`${gitdir}/refs/remotes/origin/test-tag`)).toBe(
      false
    )
    expect(fs.existsSync(`${gitdir}/refs/heads/test-tag`)).toBe(false)
    expect(fs.existsSync(`${gitdir}/refs/tags/test-tag`)).toBe(true)
    expect(fs.existsSync(`${dir}/package.json`)).toBe(true)
  })
})
