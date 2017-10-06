import server from './__helpers__/http-backend'
import nock from 'nock'
import concat from 'simple-concat'
import pify from 'pify'
import git from '..'
import { copyFixtureIntoTempDir } from 'jest-fixtures'

describe('push', () => {
  test('to local git-http-backend', async () => {
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

    let res = await git()
      .gitdir(clientDir)
      .remote('pseudo')
      .push('refs/heads/master')
    expect(res).toBeTruthy()
    let body = await pify(concat)(res)
    expect(body.toString()).toBe(`000eunpack ok
0019ok refs/heads/master
0000`)
  })

  test('to Github', async () => {
    let clientDir = await copyFixtureIntoTempDir(
      __dirname,
      'test-push-client.git'
    )

    let res = await git()
      .gitdir(clientDir)
      .githubToken(process.env.GITHUB_TOKEN)
      .remote('origin')
      .push('refs/heads/master')

    expect(res).toBeTruthy()
    let body = await pify(concat)(res)
    expect(body.toString()).toBe(`000eunpack ok
0019ok refs/heads/master
00000000`)
  })
})
