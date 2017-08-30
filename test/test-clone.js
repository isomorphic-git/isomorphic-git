import test from 'ava'
import git from '../lib'
import {exists, tmpdir, cleanup} from './_helpers'

// TODO: Add logic to use X-RateLimit-Remaining to throttle requests
// or just abandon Github API and go straight smart HTTP protocol all the way.
test.skip(async t => {
  let dir = await tmpdir()
  await git(`${dir}`).githubToken(process.env.GITHUB_TOKEN).clone(`https://github.com/wmhilton/esgit`)
  t.true(exists(`${dir}`))
  t.true(exists(`${dir}/.git/objects`))
  t.true(exists(`${dir}/.git/refs/remotes/origin/master`))
  await cleanup()
})
