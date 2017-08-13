import test from 'ava'
import git from '../lib'
import {exists, tmpdir, cleanup} from './_helpers'

test(async t => {
  let dir = await tmpdir()
  await git(`${dir}`).githubToken(process.env.GITHUB_TOKEN).clone(`https://github.com/wmhilton/esgit`)
  t.true(exists(`${dir}`))
  t.true(exists(`${dir}/.git/objects`))
  t.true(exists(`${dir}/.git/refs/remotes/origin/master`))
  await cleanup()
})
