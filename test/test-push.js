import test from 'ava'
import server from './_real-http-backend'
import nock from 'nock'
import concat from 'simple-concat'
import pify from 'pify'
import git from '..'
import path from 'path'
import { tmpdir } from './_helpers'
import ncp from 'ncp'

test('push (to local git-http-backend)', async t => {
  // Setup
  let serverDir = await tmpdir()
  let clientDir = await tmpdir()
  await pify(ncp)(
    'fixtures/test-push-server.git',
    path.join(serverDir, 'foo.git')
  )
  await pify(ncp)('fixtures/test-push-client.git', clientDir)
  // Test
  const { get, postReceivePackRequest } = server(serverDir)
  nock('http://example.dev')
    // .get('/test-push.git/info/refs?service=git-receive-pack')
    .get(/.*/)
    .reply(200, get)
    .post(/.*/)
    .reply(200, postReceivePackRequest)

  let res = await git()
    .gitdir('fixtures/test-push-client.git')
    .remote('pseudo')
    .push('refs/heads/master')
  t.truthy(res)
  let body = await pify(concat)(res)
  t.is(
    body.toString(),
    `000eunpack ok
0019ok refs/heads/master
0000`
  )
})

test('push (to Github)', async t => {
  let clientDir = await tmpdir()
  await pify(ncp)('fixtures/test-push-client.git', clientDir)

  let res = await git()
    .gitdir(clientDir)
    .githubToken(process.env.GITHUB_TOKEN)
    .remote('origin')
    .push('refs/heads/master')

  t.truthy(res)
  let body = await pify(concat)(res)
  t.is(
    body.toString(),
    `000eunpack ok
0019ok refs/heads/master
00000000`
  )
})
