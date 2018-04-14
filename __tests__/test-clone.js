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
    expect(fs.existsSync(`${gitdir}/refs/remotes/origin/test-tag`)).toBe(false)
    expect(fs.existsSync(`${gitdir}/refs/heads/test-tag`)).toBe(false)
    expect(fs.existsSync(`${gitdir}/refs/tags/test-tag`)).toBe(true)
    expect(fs.existsSync(`${dir}/package.json`)).toBe(true)
  })
  // For now we are only running this in the browser, because the karma middleware solution only
  // works when running in Karma, and these tests also need to pass Jest and node-jasmine.
  // At some point, we need to wrap git-http-server so it can be launched pre-test and killed post-test
  // when running in jest/jasmine.
  ;(process.browser ? it : xit)(
    'clone from karma-git-http-server-middleware',
    async () => {
      let { fs, dir, gitdir } = await makeFixture('test-clone-karma')
      let url = `http://localhost:9876/git-server/test-status.git`
      await clone({
        fs,
        dir,
        gitdir,
        depth: 1,
        singleBranch: true,
        url
      })
      expect(fs.existsSync(`${dir}`)).toBe(true, `'dir' exists`)
      expect(fs.existsSync(`${gitdir}/objects`)).toBe(
        true,
        `'gitdir/objects' exists`
      )
      expect(fs.existsSync(`${gitdir}/refs/heads/master`)).toBe(
        true,
        `'gitdir/refs/heads/master' exists`
      )
      expect(fs.existsSync(`${dir}/a.txt`)).toBe(true, `'a.txt' exists`)
    }
  )
})
