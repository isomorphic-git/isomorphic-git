/* global test describe expect */
import server from './__helpers__/http-backend'
import nock from 'nock'
import concat from 'simple-concat'
import pify from 'pify'
import fs from 'fs'
import { copyFixtureIntoTempDir } from 'jest-fixtures'

import { push } from '../dist/for-node/commands'

/** @test {push} */
describe('push', () => {
  test('"refs/heads/master" to local git-http-backend', async () => {
    // Setup
    let serverDir = await copyFixtureIntoTempDir(__dirname, 'test-push-server')
    let clientDir = await copyFixtureIntoTempDir(
      __dirname,
      'test-push-client.git'
    )
    // Test
    const { get, postReceivePackRequest } = server(serverDir)
    nock('http://example.dev')
      // .get('/test-push.git/info/refs?service=git-receive-pack')
      .get(/.*/)
      .reply(200, get)
      .post(/.*/)
      .reply(200, postReceivePackRequest)

    let repo = { fs, gitdir: clientDir }
    let res = await push({
      ...repo,
      remote: 'pseudo',
      ref: 'refs/heads/master'
    })
    expect(res).toBeTruthy()
    expect(res.ok).toBeTruthy()
    expect(res.ok[0]).toBe('unpack')
    expect(res.ok[1]).toBe('refs/heads/master')
  })

  test('"master" to local git-http-backend', async () => {
    // Setup
    let serverDir = await copyFixtureIntoTempDir(__dirname, 'test-push-server')
    let clientDir = await copyFixtureIntoTempDir(
      __dirname,
      'test-push-client.git'
    )
    // Test
    const { get, postReceivePackRequest } = server(serverDir)
    nock('http://example.dev')
      // .get('/test-push.git/info/refs?service=git-receive-pack')
      .get(/.*/)
      .reply(200, get)
      .post(/.*/)
      .reply(200, postReceivePackRequest)
    let repo = { fs, gitdir: clientDir }
    let res = await push({
      ...repo,
      remote: 'pseudo',
      ref: 'master'
    })
    expect(res).toBeTruthy()
    expect(res.ok).toBeTruthy()
    expect(res.ok[0]).toBe('unpack')
    expect(res.ok[1]).toBe('refs/heads/master')
  })

  test('"refs/heads/master" to Github', async () => {
    let clientDir = await copyFixtureIntoTempDir(
      __dirname,
      'test-push-client.git'
    )
    let repo = { fs, gitdir: clientDir }
    let res = await push({
      ...repo,
      authUsername: process.env.GITHUB_TOKEN,
      authPassword: process.env.GITHUB_TOKEN,
      remote: 'origin',
      ref: 'refs/heads/master'
    })
    expect(res).toBeTruthy()
    expect(res.ok).toBeTruthy()
    expect(res.ok[0]).toBe('unpack')
    expect(res.ok[1]).toBe('refs/heads/master')
  })

  test('"master" to Github', async () => {
    let clientDir = await copyFixtureIntoTempDir(
      __dirname,
      'test-push-client.git'
    )
    let repo = { fs, gitdir: clientDir }
    let res = await push({
      ...repo,
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
