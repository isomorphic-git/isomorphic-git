import test from 'ava'
import git from '../lib'
import {exists, tmpdir, cleanup} from './_helpers'

test(async t => {
  let dir = await tmpdir()
  await git(dir).init()
  t.true(exists(dir))
  t.true(exists(`${dir}/.git/objects`))
  t.true(exists(`${dir}/.git/refs/heads`))
  t.true(exists(`${dir}/.git/HEAD`))
  await cleanup()
})
