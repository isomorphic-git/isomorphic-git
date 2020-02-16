/* eslint-env node, browser, jasmine */
import http from 'isomorphic-git/http'

const { clone, checkout, listFiles, commit } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

// this is so it works with either Node local tests or Browser WAN tests
const localhost =
  typeof window === 'undefined' ? 'localhost' : window.location.hostname

describe('submodule "support"', () => {
  it('submodules are still staged after fresh clone', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-clone-submodules')
    await clone({
      fs,
      http,
      dir,
      gitdir,
      url: `http://${localhost}:8888/test-submodules.git`,
    })
    // Test
    expect(await listFiles({ fs, gitdir })).toContain('test.empty')
  })

  it('submodules are still staged after making a commit', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-clone-submodules')
    await clone({
      fs,
      http,
      dir,
      gitdir,
      url: `http://${localhost}:8888/test-submodules.git`,
    })
    // Test
    await commit({
      fs,
      gitdir,
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
      message: 'test commit',
    })
    expect(await listFiles({ fs, gitdir })).toContain('test.empty')
  })

  it('submodules are staged when switching to a branch that has them', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-clone-submodules')
    await clone({
      fs,
      http,
      dir,
      gitdir,
      ref: 'no-modules',
      url: `http://${localhost}:8888/test-submodules.git`,
    })
    // Test
    await checkout({
      fs,
      dir,
      gitdir,
      ref: 'master',
    })
    expect(await listFiles({ fs, gitdir })).toContain('test.empty')
  })

  it("submodules are unstaged when switching to a branch that doesn't have them", async () => {
    const { fs, dir, gitdir } = await makeFixture('test-clone-submodules')
    await clone({
      fs,
      http,
      dir,
      gitdir,
      url: `http://${localhost}:8888/test-submodules.git`,
    })
    // Test
    await checkout({ fs, dir, gitdir, ref: 'no-modules' })
    expect(await listFiles({ fs, gitdir })).not.toContain('test.empty')
  })
})
