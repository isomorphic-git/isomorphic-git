import test from 'ava'
import git from '..'
import { exists, tmpdir } from './helpers'

test(async t => {
  let dir = await tmpdir()
  await git(`${dir}`)
    .depth(1)
    .branch('master')
    .clone(`https://github.com/wmhilton/isomorphic-git`)
  t.true(exists(`${dir}`))
  t.true(exists(`${dir}/.git/objects`))
  t.true(exists(`${dir}/.git/refs/remotes/origin/master`))
})
