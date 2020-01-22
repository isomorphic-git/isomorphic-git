/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const {
  clone,
  checkout,
  listFiles,
  fastCheckout,
  commit
} = require('isomorphic-git')

// this is so it works with either Node local tests or Browser WAN tests
const localhost =
  typeof window === 'undefined' ? 'localhost' : window.location.hostname

describe('submodule "support"', () => {
  it('submodules are still staged after fresh clone', async () => {
    const { dir, gitdir } = await makeFixture('test-clone-submodules')
    await clone({
      dir,
      gitdir,
      url: `http://${localhost}:8888/test-submodules.git`,
      noSubmodules: true,
      newSubmoduleBehavior: true
    })
    // Test
    expect(await listFiles({ gitdir })).toContain('test.empty')
  })

  it('submodules are still staged after making a commit', async () => {
    const { dir, gitdir } = await makeFixture('test-clone-submodules')
    await clone({
      dir,
      gitdir,
      url: `http://${localhost}:8888/test-submodules.git`,
      noSubmodules: true,
      newSubmoduleBehavior: true
    })
    // Test
    await commit({
      gitdir,
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0
      },
      message: 'test commit'
    })
    expect(await listFiles({ gitdir })).toContain('test.empty')
  })

  it('submodules are staged when switching to a branch that has them (checkout)', async () => {
    const { dir, gitdir } = await makeFixture('test-clone-submodules')
    await clone({
      dir,
      gitdir,
      ref: 'no-modules',
      url: `http://${localhost}:8888/test-submodules.git`,
      noSubmodules: true,
      newSubmoduleBehavior: true
    })
    // Test
    await checkout({
      dir,
      gitdir,
      ref: 'master',
      noSubmodules: true,
      newSubmoduleBehavior: true
    })
    expect(await listFiles({ gitdir })).toContain('test.empty')
  })

  it("submodules are unstaged when switching to a branch that doesn't have them (checkout)", async () => {
    const { dir, gitdir } = await makeFixture('test-clone-submodules')
    await clone({
      dir,
      gitdir,
      url: `http://${localhost}:8888/test-submodules.git`,
      noSubmodules: true,
      newSubmoduleBehavior: true
    })
    // Test
    await checkout({ dir, gitdir, ref: 'no-modules' })
    expect(await listFiles({ gitdir })).not.toContain('test.empty')
  })

  it('submodules are staged when switching to a branch that has them (fastCheckout)', async () => {
    const { dir, gitdir } = await makeFixture('test-clone-submodules')
    await clone({
      dir,
      gitdir,
      ref: 'no-modules',
      url: `http://${localhost}:8888/test-submodules.git`,
      noSubmodules: true,
      newSubmoduleBehavior: true
    })
    // Test
    await fastCheckout({
      dir,
      gitdir,
      ref: 'master',
      noSubmodules: true,
      newSubmoduleBehavior: true
    })
    expect(await listFiles({ gitdir })).toContain('test.empty')
  })

  it("submodules are unstaged when switching to a branch that doesn't have them (fastCheckout)", async () => {
    const { dir, gitdir } = await makeFixture('test-clone-submodules')
    await clone({
      dir,
      gitdir,
      url: `http://${localhost}:8888/test-submodules.git`,
      noSubmodules: true,
      newSubmoduleBehavior: true
    })
    // Test
    await fastCheckout({ dir, gitdir, ref: 'no-modules' })
    expect(await listFiles({ gitdir })).not.toContain('test.empty')
  })
})
