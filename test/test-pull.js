import test from 'ava'
import server from './_real-http-backend'
import nock from 'nock'
import concat from 'simple-concat'
import pify from 'pify'
import git from '..'
import path from 'path'
import { tmpdir } from './_helpers'
import ncp from 'ncp'

test.skip('fetch (from local git-http-backend)', async t => {
  // Setup
  let serverDir = await tmpdir()
  let clientDir = await tmpdir()
  await pify(ncp)(
    'fixtures/test-pull-server.git',
    path.join(serverDir, 'foo.git')
  )
  await pify(ncp)('fixtures/test-pull-client.git', clientDir)
  const { get, postUploadPackRequest } = server(serverDir)
  // Test
  nock('http://example.dev')
    .get(/.*/)
    .reply(200, get)
    .post(/.*/)
    .reply(200, postUploadPackRequest)

  let res = await git()
    .gitdir(clientDir)
    .remote('pseudo')
    .pull('refs/heads/master')
  t.truthy(res)
  let body = await pify(concat)(res)
  console.log('body.toString() =', body.toString())
  t.is(
    body.toString(),
    `000eunpack ok
0019ok refs/heads/master
0000`
  )
})

test('pull (from Github)', async t => {
  // Setup
  let clientDir = await tmpdir()
  await pify(ncp)('fixtures/test-pull-client.git', clientDir)

  let res = await git()
    .gitdir(clientDir)
    .remote('origin')
    .pull('refs/heads/master')
  console.log(res.statusCode)
  console.log(res.headers)
  t.truthy(res)
  let body = await pify(concat)(res)
  console.log('body.toString() =', body.toString('utf8'))
  t.is(
    body.toString(),
    `000eunpack ok
0019ok refs/heads/master
00000000`
  )
})
