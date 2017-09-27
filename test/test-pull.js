import test from 'ava'
import server from './_real-http-backend'
import nock from 'nock'
import concat from 'simple-concat'
import pify from 'pify'
import git from '..'
import path from 'path'
import { tmpdir } from './_helpers'
import ncp from 'ncp'
import simpleGet from 'simple-get'
import stream from 'stream'

// TODO: figure out why this test doesn't work
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
})

test.skip('fetch packfile (directly) from Github', async t => {
  let postBody = new stream.PassThrough()
  postBody.write(
    '008awant 97c024f73eaab2781bf3691597bc7c833cb0e22f multi_ack_detailed no-done side-band-64k thin-pack ofs-delta agent=git/2.10.1.windows.1\n'
  )
  postBody.write('0000')
  postBody.write('0009done\n')
  postBody.end()
  let res = await pify(simpleGet)({
    url: 'https://github.com/wmhilton/test.empty/git-upload-pack',
    body: postBody,
    headers: {
      'user-agent': 'git/2.10.1.windows.1'
    }
  })
  let body = await pify(concat)(res)
  console.log('body =', body.toString())
})

test.skip('fetch packfile (directly) from Github 2', async t => {
  let postBody = new stream.PassThrough()
  postBody.write(
    '008awant 0094dadf9804971c851e99b13845d10c8849db12 multi_ack_detailed no-done side-band-64k thin-pack ofs-delta agent=git/2.10.1.windows.1\n'
  )
  postBody.write('0000')
  postBody.write('0032have d62629c4e50b22785909dc5cd81982f6f579437c\n')
  postBody.write('0000')
  postBody.write('0009done\n')
  postBody.end()
  let res = await pify(simpleGet)({
    url: 'https://github.com/wmhilton/isomorphic-git/git-upload-pack',
    body: postBody,
    headers: {
      'user-agent': 'git/2.10.1.windows.1'
    }
  })
  let body = await pify(concat)(res)
  console.log('body =', body.toString())
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
  t.true(
    body.toString()
      .startsWith(`0038ACK 5a8905a02e181fe1821068b8c0f48cb6633d5b81 common
0037ACK 5a8905a02e181fe1821068b8c0f48cb6633d5b81 ready
0008NAK
0031ACK 5a8905a02e181fe1821068b8c0f48cb6633d5b81`)
  )
})
