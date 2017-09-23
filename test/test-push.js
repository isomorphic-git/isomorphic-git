import test from 'ava'
import { push } from '../lib/commands/push'
import server from './_real-http-backend'
import nock from 'nock'
import concat from 'simple-concat'
import pify from 'pify'
import git from '..'
import { write } from '../lib/utils/write'
import path from 'omnipath'
import { mkdir } from '../lib/utils/mkdirs'
import { exists, tmpdir } from './_helpers'

test('push (to local git-http-backend)', async t => {
  // Setup
  let dir = await tmpdir()
  const { get, postReceivePackRequest } = server(dir)
  let gitdir = path.join(dir, 'foo.git')
  await mkdir(gitdir)
  let repo = git().gitdir(gitdir)
  await repo.init()
  await repo.setConfig('core.bare', true)
  await write(path.join(gitdir, 'git-daemon-export-ok'), '')
  console.log('gitdir =', gitdir)
  // await repo.setConfig('remote "origin".url', 'http://example.dev/test-push')
  t.true(exists(gitdir))
  t.true(exists(path.join(gitdir, 'objects')))
  t.true(exists(path.join(gitdir, 'refs/heads')))
  t.true(exists(path.join(gitdir, 'HEAD')))
  // Test
  nock('http://example.dev')
    // .get('/test-push.git/info/refs?service=git-receive-pack')
    .get(/.*/)
    .reply(200, get)
    .post(/.*/)
    .reply(200, postReceivePackRequest)

  // TODO: use the fluent command builder instead of directly
  let res = await push({
    gitdir: 'fixtures/test-push.git',
    ref: 'refs/heads/master',
    url: 'http://example.dev/foo.git'
  })
  t.truthy(res)
  let body = await pify(concat)(res)
  t.is(
    body.toString(),
    `000eunpack ok
0019ok refs/heads/master
0000`
  )
})

test.skip('push (to Github)', async t => {
  let res = await git()
    .gitdir('fixtures/test-push.git')
    .githubToken(process.env.GITHUB_TOKEN)
    .remote('origin')
    .push('refs/heads/master')
  console.log(res)
  t.truthy(res)
  let body = await pify(concat)(res)
  t.is(
    body.toString(),
    `000eunpack ok
0019ok refs/heads/master
00000000`
  )
})
