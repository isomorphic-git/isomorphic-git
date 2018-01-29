/* globals describe it expect */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { clone } = require('..')

jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000

describe('clone', () => {
  ;(process.env.CI ? it : xit)('clone', async () => {
    let { fs, dir, gitdir } = await makeFixture('isomorphic-git')
    await clone({
      fs,
      dir,
      gitdir,
      depth: 1,
      branch: 'master',
      url:
        'https://cors-buster-jfpactjnem.now.sh/github.com/isomorphic-git/isomorphic-git'
    })
    console.log('clone')
    expect(fs.existsSync(`${dir}`)).toBe(true)
    expect(fs.existsSync(`${gitdir}/objects`)).toBe(true)
    expect(fs.existsSync(`${gitdir}/refs/remotes/origin/master`)).toBe(true)
    expect(fs.existsSync(`${dir}/package.json`)).toBe(true)
  })
})
