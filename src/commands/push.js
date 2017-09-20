import GitRemoteHTTP from '../managers/GitRemoteHTTP'
import listCommits from './listCommits'
import listObjects from './listObjects'

export default async function push ({ gitdir, ref = 'HEAD', url }) {
  let remote = new GitRemoteHTTP(url)
  await remote.discover()
  let commits = await listCommits({
    gitdir,
    start: [ref],
    finish: remote.refs.values()
  })
  let objects = await listObjects({ gitdir, oids: commits })
  let packstream = new stream.PassThrough()
  git()
    .gitdir('fixtures/test-pack.git')
    .outputStream(packstream)
    .pack(objects)
  let response = await remote.push(packstream)
}
