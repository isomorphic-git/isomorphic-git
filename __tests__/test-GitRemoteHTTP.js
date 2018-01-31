/* global test describe expect */
import nock from 'nock'
import server from './__helpers__/http-backend'
import { managers } from '../dist/for-node/internal-apis'
const { GitRemoteHTTP } = managers

const { get } = server('__tests__/__fixtures__')

describe('GitRemoteHTTP', () => {
  test('preparePull (Github response)', async () => {
    let remote = new GitRemoteHTTP(
      'https://github.com/isomorphic-git/isomorphic-git'
    )
    await remote.preparePull()
    expect(remote).toBeTruthy()
    expect(remote.symrefs.size > 0)
    expect(remote.symrefs.get('HEAD')).toBe('refs/heads/master')
  })

  test('preparePull (mock response)', async () => {
    nock('http://example.dev')
      .get('/test-GitRemoteHTTP.git/info/refs?service=git-upload-pack')
      // .get(/.*/)
      .reply(
        200,
        `001e# service=git-upload-pack
00000000`,
      {
        Expires: 'Fri, 01 Jan 1980 00:00:00 GMT',
        Pragma: 'no-cache',
        'Cache-Control': 'no-cache, max-age=0, must-revalidate',
        'Content-Type': 'application/x-git-upload-pack-advertisement'
      }
      )

    let remote = new GitRemoteHTTP('http://example.dev/test-GitRemoteHTTP')
    await remote.preparePull()
    expect(remote).toBeTruthy()
  })

  test.skip('preparePull (real git-http-backend response)', async () => {
    nock('http://example.dev')
      .get('/test-GitRemoteHTTP.git/info/refs?service=git-upload-pack')
      .reply(200, get)

    let remote = new GitRemoteHTTP('http://example.dev/test-GitRemoteHTTP')
    await remote.preparePull()
    // console.log(remote.capabilities)
    expect(remote).toBeTruthy()
  })

  test('preparePush (mock response)', async () => {
    nock('http://example.dev')
      .get('/test-GitRemoteHTTP.git/info/refs?service=git-receive-pack')
      // .get(/.*/)
      .reply(
        200,
        `001f# service=git-receive-pack
000000970000000000000000000000000000000000000000 capabilities^{}\0report-status delete-refs side-band-64k quiet atomic ofs-delta agent=git/2.10.1.windows.1
0000`,
      {
        Expires: 'Fri, 01 Jan 1980 00:00:00 GMT',
        Pragma: 'no-cache',
        'Cache-Control': 'no-cache, max-age=0, must-revalidate',
        'Content-Type': 'application/x-git-receive-pack-advertisement'
      }
      )

    let remote = new GitRemoteHTTP('http://example.dev/test-GitRemoteHTTP')
    await remote.preparePush()
    // console.log(remote)
    expect(remote).toBeTruthy()
  })

  test.skip('preparePush (real git-http-backend response)', async () => {
    nock('http://example.dev')
      .get('/test-GitRemoteHTTP.git/info/refs?service=git-receive-pack')
      .reply(200, get)

    let remote = new GitRemoteHTTP('http://example.dev/test-GitRemoteHTTP')
    await remote.preparePush()
    console.log(remote)
    expect(remote).toBeTruthy()
  })
})
