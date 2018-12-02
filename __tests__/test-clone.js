/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { plugins, clone } = require('isomorphic-git')

describe('clone', () => {
  // Unfortunately, cloning without singleBranch: true means the test time increases
  // linearly with the number of branches in the repo... which increases with the number
  // of pull requests. So automated tools to update dependencies via PRs can overwhelm
  // the system and make this test take way too long.
  xit('clone with noTags', async () => {
    let { fs, dir, gitdir } = await makeFixture('isomorphic-git')
    plugins.set('fs', fs)
    await clone({
      dir,
      gitdir,
      depth: 1,
      ref: 'test-branch',
      noTags: true,
      url: 'https://github.com/isomorphic-git/isomorphic-git',
      corsProxy: process.browser ? `http://localhost:9999` : undefined
    })
    expect(fs.existsSync(`${dir}`)).toBe(true)
    expect(fs.existsSync(`${gitdir}/objects`)).toBe(true)
    expect(fs.existsSync(`${gitdir}/refs/remotes/origin/test-branch`)).toBe(
      true
    )
    expect(fs.existsSync(`${gitdir}/refs/heads/test-branch`)).toBe(true)
    expect(fs.existsSync(`${dir}/package.json`)).toBe(true)
    expect(fs.existsSync(`${gitdir}/refs/tags/v0.0.1`)).toBe(false)
  })
  it('clone with noCheckout', async () => {
    let { fs, dir, gitdir } = await makeFixture('isomorphic-git')
    plugins.set('fs', fs)
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
    expect(fs.existsSync(`${dir}`)).toBe(true)
    expect(fs.existsSync(`${gitdir}/objects`)).toBe(true)
    expect(fs.existsSync(`${gitdir}/refs/remotes/origin/test-branch`)).toBe(
      true
    )
    expect(fs.existsSync(`${gitdir}/refs/heads/test-branch`)).toBe(true)
    expect(fs.existsSync(`${dir}/package.json`)).toBe(false)
  })
  it('clone a tag', async () => {
    let { fs, dir, gitdir } = await makeFixture('isomorphic-git')
    plugins.set('fs', fs)
    await clone({
      dir,
      gitdir,
      depth: 1,
      singleBranch: true,
      ref: 'test-tag',
      url: 'https://github.com/isomorphic-git/isomorphic-git',
      corsProxy: process.browser ? `http://localhost:9999` : undefined
    })
    expect(fs.existsSync(`${dir}`)).toBe(true)
    expect(fs.existsSync(`${gitdir}/objects`)).toBe(true)
    expect(fs.existsSync(`${gitdir}/refs/remotes/origin/test-tag`)).toBe(false)
    expect(fs.existsSync(`${gitdir}/refs/heads/test-tag`)).toBe(false)
    expect(fs.existsSync(`${gitdir}/refs/tags/test-tag`)).toBe(true)
    expect(fs.existsSync(`${dir}/package.json`)).toBe(true)
  })
  it('clone with an unregistered protocol', async () => {
    let { fs, dir, gitdir } = await makeFixture('isomorphic-git')
    plugins.set('fs', fs)
    let url = `foobar://github.com/isomorphic-git/isomorphic-git`
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
    let { fs, dir, gitdir } = await makeFixture('test-clone-karma')
    plugins.set('fs', fs)
    await clone({
      dir,
      gitdir,
      depth: 1,
      singleBranch: true,
      url: 'http://localhost:8888/test-status.git'
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
  })
})
