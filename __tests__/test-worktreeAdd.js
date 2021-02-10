/* eslint-env node, browser, jasmine */
import http from 'isomorphic-git/http'

const { worktreeAdd } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('worktreeAdd', () => {
  // Note: because worktreeAdd relies on clone underneath, the same performance issues
  // that plague clone tests are also relevant here
  it('worktreeAdd without ref', async () => {
    const { fs, dir, gitdir } = await makeFixture('isomorphic-git')
    await worktreeAdd({
      fs,
      http,
      dir,
      gitdir,
      path: '../test-branch',
    })
    expect(await fs.exists(`${dir}/../test-branch`)).toBe(true)
    expect(await fs.exists(`${dir}/../test-branch/.git/objects`)).toBe(true)
    expect(
      await fs.exists(
        `${dir}/../test-branch/.git/refs/remotes/origin/test-branch`
      )
    ).toBe(true)
    expect(
      await fs.exists(`${dir}/../test-branch/.git/refs/heads/test-branch`)
    ).toBe(true)
    expect(await fs.exists(`${dir}/../test-branch/package.json`)).toBe(false)
  })
  it('worktreeAdd with ref', async () => {
    const { fs, dir, gitdir } = await makeFixture('isomorphic-git')
    await worktreeAdd({
      fs,
      http,
      dir,
      gitdir,
      path: '../test-repo',
      ref: 'test-branch',
    })
    expect(await fs.exists(`${dir}/../test-repo`)).toBe(true)
    expect(await fs.exists(`${dir}/../test-repo/.git/objects`)).toBe(true)
    expect(
      await fs.exists(
        `${dir}/../test-repo/.git/refs/remotes/origin/test-branch`
      )
    ).toBe(true)
    expect(
      await fs.exists(`${dir}/../test-repo/.git/refs/heads/test-branch`)
    ).toBe(true)
    expect(await fs.exists(`${dir}/../test-repo/package.json`)).toBe(false)
  })
})
