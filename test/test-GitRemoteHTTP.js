import test from 'ava'
import GitRemoteHTTP from '../lib/managers/GitRemoteHTTP'

test('GitRemoteHTTP', async t => {
  let remote = new GitRemoteHTTP('https://github.com/wmhilton/esgit')
  await remote.discover()
  console.log(remote)
  t.truthy(remote)
})
