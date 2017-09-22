import test from 'ava'
import git from '..'
import { exists, tmpdir } from './_helpers'

test(async t => {
  let dir = await tmpdir()
  await git(dir).init()
  t.true(exists(dir))
  t.true(exists(`${dir}/.git/objects`))
  t.true(exists(`${dir}/.git/refs/heads`))
  t.true(exists(`${dir}/.git/HEAD`))
})
