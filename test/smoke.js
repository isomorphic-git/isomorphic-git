import test from 'ava'
import fs from 'fs'
import del from 'delete'
let exists = fs.existsSync
import git from '../lib'

test(async t => {
  let conf = git('.').config()
  let sym = await conf.get('core.symlinks')
  let rfv = await conf.get('core.repositoryformatversion')
  let url = await conf.get('remote "origin".url')
  t.is(sym, false)
  t.is(rfv, '0')
  t.is(url, 'https://github.com/wmhilton/esgit')
})

test(async t => {
  await del('foo1')
  await git('foo1').init()
  t.true(exists('foo1'))
  t.true(exists('foo1/.git/objects'))
  t.true(exists('foo1/.git/refs/heads'))
  t.true(exists('foo1/.git/HEAD'))
  // await del('foo1')
})

test(async t => {
  await del('foo2')
  await del('foo2')
  await git('foo2').githubToken(process.env.GITHUB_TOKEN).clone('https://github.com/wmhilton/nde')
  t.true(exists('foo2'))
  t.true(exists('foo2/.git/objects'))
  t.true(exists('foo2/.git/refs/remotes/origin/master'))
  // await del('foo2')
})
