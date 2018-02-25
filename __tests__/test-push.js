/* global describe it expect */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const nock = require('nock')
const server = require('./__helpers__/http-backend')
const setTestTimeout = require('./__helpers__/set-test-timeout')
const { push } = require('..')

setTestTimeout(60000)

describe('push', () => {
  it('"refs/heads/master" to local git-http-backend', async () => {
    // Setup
    let { fs, dir, gitdir } = await makeFixture('test-push')
    // Test
    const { get, postReceivePackRequest } = server(dir)
    nock('http://example.dev')
      // .get('/test-push.git/info/refs?service=git-receive-pack')
      .get(/.*/)
      .reply(200, get)
      .post(/.*/)
      .reply(200, postReceivePackRequest)

    let res = await push({
      fs,
      gitdir,
      remote: 'pseudo',
      ref: 'refs/heads/master'
    })
    expect(res).toBeTruthy()
    expect(res.ok).toBeTruthy()
    expect(res.ok[0]).toBe('unpack')
    expect(res.ok[1]).toBe('refs/heads/master')
  })

  it('"master" to local git-http-backend', async () => {
    // Setup
    let { fs, dir, gitdir } = await makeFixture('test-push')
    // Test
    const { get, postReceivePackRequest } = server(dir)
    nock('http://example.dev')
      // .get('/test-push.git/info/refs?service=git-receive-pack')
      .get(/.*/)
      .reply(200, get)
      .post(/.*/)
      .reply(200, postReceivePackRequest)
    let res = await push({
      fs,
      gitdir,
      remote: 'pseudo',
      ref: 'master'
    })
    expect(res).toBeTruthy()
    expect(res.ok).toBeTruthy()
    expect(res.ok[0]).toBe('unpack')
    expect(res.ok[1]).toBe('refs/heads/master')
  })
  ;(process.env.GITHUB_TOKEN ? it : xit)(
    '"refs/heads/master" to Github',
    async () => {
      // Setup
      let { fs, gitdir } = await makeFixture('test-push')
      // Test
      let res = await push({
        fs,
        gitdir,
        authUsername: process.env.GITHUB_TOKEN,
        authPassword: process.env.GITHUB_TOKEN,
        remote: 'origin',
        ref: 'refs/heads/master'
      })
      expect(res).toBeTruthy()
      expect(res.ok).toBeTruthy()
      expect(res.ok[0]).toBe('unpack')
      expect(res.ok[1]).toBe('refs/heads/master')
    }
  )
  ;(process.env.GITHUB_TOKEN ? it : xit)('"master" to Github', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-push')
    // Test
    let repo = { fs, gitdir }
    let res = await push({
      fs,
      gitdir,
      authUsername: process.env.GITHUB_TOKEN,
      authPassword: process.env.GITHUB_TOKEN,
      remote: 'origin',
      ref: 'master'
    })
    expect(res).toBeTruthy()
    expect(res.ok).toBeTruthy()
    expect(res.ok[0]).toBe('unpack')
    expect(res.ok[1]).toBe('refs/heads/master')
  })
})
