/* globals describe it expect */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { clone } = require('..')

describe('clone', () => {
  ;(process.env.CI ? it : xit)('clone', async () => {
    let { fs, dir, gitdir } = await makeFixture('isomorphic-git')
    await clone({
      fs,
      dir,
      gitdir,
      depth: 1,
      ref: 'master',
      url:
        'https://cors-buster-jfpactjnem.now.sh/github.com/isomorphic-git/isomorphic-git'
    })
    expect(fs.existsSync(`${dir}`)).toBe(true)
    expect(fs.existsSync(`${gitdir}/objects`)).toBe(true)
    expect(fs.existsSync(`${gitdir}/refs/remotes/origin/master`)).toBe(true)
    expect(fs.existsSync(`${dir}/package.json`)).toBe(true)
  })
})
