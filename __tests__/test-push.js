/* eslint-env node, browser, jasmine */
import http from 'isomorphic-git/http'
const { makeFixture } = require('./__helpers__/FixtureFS.js')
// @ts-ignore
const snapshots = require('./__snapshots__/test-push.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')

const { setConfig, push, listBranches } = require('isomorphic-git')

// this is so it works with either Node local tests or Browser WAN tests
const localhost =
  typeof window === 'undefined' ? 'localhost' : window.location.hostname

describe('push', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })
  it('push', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-push')
    await setConfig({
      fs,
      gitdir,
      path: 'remote.karma.url',
      value: `http://${localhost}:8888/test-push-server.git`
    })
    const output = []
    // Test
    const res = await push({
      fs,
      http,
      gitdir,
      onMessage: async m => {
        output.push(m)
      },
      remote: 'karma',
      ref: 'refs/heads/master'
    })
    expect(res).toBeTruthy()
    expect(res.ok).toBe(true)
    expect(res.refs['refs/heads/master'].ok).toBe(true)
    expect(output).toMatchSnapshot()
  })
  it('push without ref', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-push')
    await setConfig({
      fs,
      gitdir,
      path: 'remote.karma.url',
      value: `http://${localhost}:8888/test-push-server.git`
    })
    // Test
    const res = await push({
      fs,
      http,
      gitdir,
      remote: 'karma'
    })
    expect(res).toBeTruthy()
    expect(res.ok).toBe(true)
    expect(res.refs['refs/heads/master'].ok).toBe(true)
  })
  it('push with ref !== remoteRef', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-push')
    await setConfig({
      fs,
      gitdir,
      path: 'remote.karma.url',
      value: `http://${localhost}:8888/test-push-server.git`
    })
    // Test
    const res = await push({
      fs,
      http,
      gitdir,
      remote: 'karma',
      ref: 'master',
      remoteRef: 'foobar'
    })
    expect(res).toBeTruthy()
    expect(res.ok).toBe(true)
    expect(res.refs['refs/heads/foobar'].ok).toBe(true)
    expect(await listBranches({ fs, gitdir, remote: 'karma' })).toContain(
      'foobar'
    )
  })
  it('push with lightweight tag', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-push')
    await setConfig({
      fs,
      gitdir,
      path: 'remote.karma.url',
      value: `http://${localhost}:8888/test-push-server.git`
    })
    // Test
    const res = await push({
      fs,
      http,
      gitdir,
      remote: 'karma',
      ref: 'lightweight-tag'
    })
    expect(res).toBeTruthy()
    expect(res.ok).toBe(true)
    expect(res.refs['refs/tags/lightweight-tag'].ok).toBe(true)
  })
  it('push with annotated tag', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-push')
    await setConfig({
      fs,
      gitdir,
      path: 'remote.karma.url',
      value: `http://${localhost}:8888/test-push-server.git`
    })
    // Test
    const res = await push({
      fs,
      http,
      gitdir,
      remote: 'karma',
      ref: 'annotated-tag'
    })
    expect(res).toBeTruthy()
    expect(res.ok).toBe(true)
    expect(res.refs['refs/tags/annotated-tag'].ok).toBe(true)
  })
  it('push delete', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-push')
    await setConfig({
      fs,
      gitdir,
      path: 'remote.karma.url',
      value: `http://${localhost}:8888/test-push-server.git`
    })
    await push({
      fs,
      http,
      gitdir,
      remote: 'karma',
      ref: 'master',
      remoteRef: 'foobar'
    })
    expect(await listBranches({ fs, gitdir, remote: 'karma' })).toContain(
      'foobar'
    )
    // Test
    const res = await push({
      fs,
      http,
      gitdir,
      remote: 'karma',
      remoteRef: 'foobar',
      delete: true
    })
    expect(res).toBeTruthy()
    expect(res.ok).toBe(true)
    expect(res.refs['refs/heads/foobar'].ok).toBe(true)
    expect(await listBranches({ fs, gitdir, remote: 'karma' })).not.toContain(
      'foobar'
    )
  })

  it('push with Basic Auth', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-push')
    await setConfig({
      fs,
      gitdir,
      path: 'remote.auth.url',
      value: `http://${localhost}:8888/test-push-server-auth.git`
    })
    // Test
    const res = await push({
      fs,
      http,
      gitdir,
      username: 'testuser',
      password: 'testpassword',
      remote: 'auth',
      ref: 'master'
    })
    expect(res).toBeTruthy()
    expect(res.ok).toBe(true)
    expect(res.refs['refs/heads/master'].ok).toBe(true)
  })
  it('push with Basic Auth credentials in the URL', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-push')
    await setConfig({
      fs,
      gitdir,
      path: 'remote.url.url',
      value: `http://testuser:testpassword@${localhost}:8888/test-push-server-auth.git`
    })
    // Test
    const res = await push({
      fs,
      http,
      gitdir,
      remote: 'url',
      ref: 'master'
    })
    expect(res).toBeTruthy()
    expect(res.ok).toBe(true)
    expect(res.refs['refs/heads/master'].ok).toBe(true)
  })
  it('throws an Error if no credentials supplied', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-push')
    await setConfig({
      fs,
      gitdir,
      path: 'remote.auth.url',
      value: `http://${localhost}:8888/test-push-server-auth.git`
    })
    // Test
    let error = null
    try {
      await push({
        fs,
        http,
        gitdir,
        remote: 'auth',
        ref: 'master'
      })
    } catch (err) {
      error = err.message
    }
    expect(error).toContain('401')
  })
  it('throws an Error if invalid credentials supplied', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-push')
    await setConfig({
      fs,
      gitdir,
      path: 'remote.auth.url',
      value: `http://${localhost}:8888/test-push-server-auth.git`
    })
    // Test
    let error = null
    try {
      await push({
        fs,
        http,
        gitdir,
        username: 'test',
        password: 'test',
        remote: 'auth',
        ref: 'master'
      })
    } catch (err) {
      error = err.message
    }
    expect(error).toContain('401')
  })
})
