/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { clone } = require('isomorphic-git')

describe('clone', () => {
  // Unfortunately, cloning without singleBranch: true means the test time increases
  // linearly with the number of branches in the repo... which increases with the number
  // of pull requests. So automated tools to update dependencies via PRs can overwhelm
  // the system and make this test take way too long.
  xit('clone with noTags', async () => {
    const { fs, dir, gitdir } = await makeFixture('isomorphic-git')
    await clone({
      dir,
      gitdir,
      depth: 1,
      ref: 'test-branch',
      noTags: true,
      url: 'https://github.com/isomorphic-git/isomorphic-git',
      corsProxy: process.browser ? `http://localhost:9999` : undefined
    })
    expect(await fs.exists(`${dir}`)).toBe(true)
    expect(await fs.exists(`${gitdir}/objects`)).toBe(true)
    expect(await fs.exists(`${gitdir}/refs/remotes/origin/test-branch`)).toBe(
      true
    )
    expect(await fs.exists(`${gitdir}/refs/heads/test-branch`)).toBe(true)
    expect(await fs.exists(`${dir}/package.json`)).toBe(true)
    expect(await fs.exists(`${gitdir}/refs/tags/v0.0.1`)).toBe(false)
  })
  it('clone with noCheckout', async () => {
    const { fs, dir, gitdir } = await makeFixture('isomorphic-git')
    await clone({
      dir,
      gitdir,
      depth: 1,
      ref: 'test-branch',
      singleBranch: true,
      noCheckout: true,
      url: 'https://github.com/isomorphic-git/isomorphic-git',
      corsProxy: process.browser ? `http://localhost:9999` : undefined
    })
    expect(await fs.exists(`${dir}`)).toBe(true)
    expect(await fs.exists(`${gitdir}/objects`)).toBe(true)
    expect(await fs.exists(`${gitdir}/refs/remotes/origin/test-branch`)).toBe(
      true
    )
    expect(await fs.exists(`${gitdir}/refs/heads/test-branch`)).toBe(true)
    expect(await fs.exists(`${dir}/package.json`)).toBe(false)
  })
  it('clone a tag', async () => {
    const { fs, dir, gitdir } = await makeFixture('isomorphic-git')
    await clone({
      dir,
      gitdir,
      depth: 1,
      singleBranch: true,
      ref: 'test-tag',
      url: 'https://github.com/isomorphic-git/isomorphic-git',
      corsProxy: process.browser ? `http://localhost:9999` : undefined
    })
    expect(await fs.exists(`${dir}`)).toBe(true)
    expect(await fs.exists(`${gitdir}/objects`)).toBe(true)
    expect(await fs.exists(`${gitdir}/refs/remotes/origin/test-tag`)).toBe(
      false
    )
    expect(await fs.exists(`${gitdir}/refs/heads/test-tag`)).toBe(false)
    expect(await fs.exists(`${gitdir}/refs/tags/test-tag`)).toBe(true)
    expect(await fs.exists(`${dir}/package.json`)).toBe(true)
  })
  it('clone with an unregistered protocol', async () => {
    const { dir, gitdir } = await makeFixture('isomorphic-git')
    const url = `foobar://github.com/isomorphic-git/isomorphic-git`
    let error = null
    try {
      await clone({
        dir,
        gitdir,
        depth: 1,
        singleBranch: true,
        ref: 'test-tag',
        url
      })
    } catch (err) {
      error = err
    }
    expect(error.message).toEqual(
      `Git remote "${url}" uses an unrecognized transport protocol: "foobar"`
    )
    expect(error.caller).toEqual('git.clone')
  })
  it('clone from git-http-mock-server', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-clone-karma')
    await clone({
      dir,
      gitdir,
      depth: 1,
      singleBranch: true,
      url: 'http://localhost:8888/test-status.git'
    })
    expect(await fs.exists(`${dir}`)).toBe(true, `'dir' exists`)
    expect(await fs.exists(`${gitdir}/objects`)).toBe(
      true,
      `'gitdir/objects' exists`
    )
    expect(await fs.exists(`${gitdir}/refs/heads/master`)).toBe(
      true,
      `'gitdir/refs/heads/master' exists`
    )
    expect(await fs.exists(`${dir}/a.txt`)).toBe(true, `'a.txt' exists`)
  })

  it('clone empty repository from git-http-mock-server', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-clone-empty')
    await clone({
      dir,
      gitdir,
      depth: 1,
      url: 'http://localhost:8888/test-empty.git'
    })
    expect(await fs.exists(`${dir}`)).toBe(true, `'dir' exists`)
    expect(await fs.exists(`${gitdir}/HEAD`)).toBe(true, `'gitdir/HEAD' exists`)
    expect((await fs.read(`${gitdir}/HEAD`)).toString('utf-8').trim()).toEqual(
      'ref: refs/heads/master',
      `'gitdir/HEAD' points to refs/heads/master`
    )
    expect(await fs.exists(`${gitdir}/refs/heads/master`)).toBe(
      false,
      `'gitdir/refs/heads/master' does not exist`
    )
  })
})
