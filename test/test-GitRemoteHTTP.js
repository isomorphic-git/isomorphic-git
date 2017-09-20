import test from 'ava'
import GitRemoteHTTP from '../lib/managers/GitRemoteHTTP'
import nock from 'nock'

test('GitRemoteHTTP', async t => {
  let remote = new GitRemoteHTTP('https://github.com/wmhilton/esgit')
  await remote.discover()
  console.log(remote)
  t.truthy(remote)
})

test('GitRemoteHTTP', async t => {
  
  nock('http://example.dev')
  .get('/test-push.git/info/refs?service=git-upload-pack')
  // .get(/.*/)
  .reply(200, `001e# service=git-upload-pack\n00000000`, {
    'Expires': 'Fri, 01 Jan 1980 00:00:00 GMT',
    'Pragma': 'no-cache',
    'Cache-Control': 'no-cache, max-age=0, must-revalidate',
    'Content-Type': 'application/x-git-upload-pack-advertisement'
  })
  
  let remote = new GitRemoteHTTP('http://example.dev/test-push')
  await remote.discover()
  console.log(remote)
  t.truthy(remote)
})
