import test from 'ava'
import GitRemoteHTTP from '../lib/managers/GitRemoteHTTP'
import nock from 'nock'

test.skip('GitRemoteHTTP', async t => {
  let remote = new GitRemoteHTTP('https://github.com/wmhilton/esgit')
  await remote.preparePull()
  console.log(remote)
  t.truthy(remote)
})

test('preparePull', async t => {
  nock('http://example.dev')
    .get('/test-push.git/info/refs?service=git-upload-pack')
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

  let remote = new GitRemoteHTTP('http://example.dev/test-push')
  await remote.preparePull()
  console.log(remote)
  t.truthy(remote)
})

test('preparePush', async t => {
  nock('http://example.dev')
    .get('/test-push.git/info/refs?service=git-receive-pack')
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

  let remote = new GitRemoteHTTP('http://example.dev/test-push')
  await remote.preparePush()
  console.log(remote)
  t.truthy(remote)
})
