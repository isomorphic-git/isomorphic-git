/* eslint-env node, browser, jasmine */
import http from 'isomorphic-git/http'

const { Errors, currentBranch, clone, resolveRef } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

// this is so it works with either Node local tests or Browser WAN tests
const localhost =
  typeof window === 'undefined' ? 'localhost' : window.location.hostname

describe('clone', () => {
  // Note: for a long time this test was disabled because it took too long.
  // It seems to only take a couple seconds longer than the "shallow fetch" tests now,
  // so I'm enabling it.
  // Update: well, it's now slow enough on Edge that it's failing. Which is odd bc
  // it's the New Edge with is Chromium-based.
  ;(process.browser ? xit : it)('clone with noTags', async () => {
    const { fs, dir, gitdir } = await makeFixture('isomorphic-git')
    await clone({
      fs,
      http,
      dir,
      gitdir,
      depth: 1,
      ref: 'test-branch',
      noTags: true,
      url: 'https://github.com/isomorphic-git/isomorphic-git.git',
      corsProxy: process.browser ? `http://${localhost}:9999` : undefined,
      noCheckout: true,
    })
    expect(await fs.exists(`${dir}`)).toBe(true)
    expect(await fs.exists(`${gitdir}/objects`)).toBe(true)
    expect(
      await resolveRef({ fs, gitdir, ref: 'refs/remotes/origin/test-branch' })
    ).toBe('e10ebb90d03eaacca84de1af0a59b444232da99e')
    expect(
      await resolveRef({ fs, gitdir, ref: 'refs/heads/test-branch' })
    ).toBe('e10ebb90d03eaacca84de1af0a59b444232da99e')
    let err = null
    try {
      await resolveRef({ fs, gitdir, ref: 'refs/tags/v0.0.1' })
    } catch (e) {
      err = e
    }
    expect(err).not.toBeNull()
    expect(err.code).toBe(Errors.NotFoundError.code)
  })
  it('clone with noCheckout', async () => {
    const { fs, dir, gitdir } = await makeFixture('isomorphic-git')
    await clone({
      fs,
      http,
      dir,
      gitdir,
      depth: 1,
      ref: 'test-branch',
      singleBranch: true,
      noCheckout: true,
      url: 'https://github.com/isomorphic-git/isomorphic-git.git',
      corsProxy: process.browser ? `http://${localhost}:9999` : undefined,
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
      fs,
      http,
      dir,
      gitdir,
      depth: 1,
      singleBranch: true,
      ref: 'test-tag',
      url: 'https://github.com/isomorphic-git/isomorphic-git.git',
      corsProxy: process.browser ? `http://${localhost}:9999` : undefined,
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
    const { fs, dir, gitdir } = await makeFixture('isomorphic-git')
    const url = `foobar://github.com/isomorphic-git/isomorphic-git`
    let error = null
    try {
      await clone({
        fs,
        http,
        dir,
        gitdir,
        depth: 1,
        singleBranch: true,
        ref: 'test-tag',
        url,
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
      fs,
      http,
      dir,
      gitdir,
      depth: 1,
      singleBranch: true,
      url: `http://${localhost}:8888/test-clone.git`,
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

  it('clone default branch with --singleBranch', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-clone-karma')
    await clone({
      fs,
      http,
      dir,
      gitdir,
      depth: 1,
      singleBranch: true,
      url: `http://${localhost}:8888/test-clone-no-master.git`,
    })
    expect(await currentBranch({ fs, dir, gitdir })).toBe('i-am-not-master')
  })

  it('clone empty repository from git-http-mock-server', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-clone-empty')
    await clone({
      fs,
      http,
      dir,
      gitdir,
      depth: 1,
      url: `http://${localhost}:8888/test-empty.git`,
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
