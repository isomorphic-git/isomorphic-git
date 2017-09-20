import GitRemoteHTTP from '../managers/GitRemoteHTTP'
import listCommits from './listCommits'
import listObjects from './listObjects'
import resolveRef from '../utils/resolveRef'
import { encode, flush } from '../utils/pkt-line-encoder'

export default async function push ({ gitdir, ref = 'HEAD', url }) {
  let oid = await resolveRef({ gitdir, ref })
  let remote = new GitRemoteHTTP(url)
  await remote.preparePush()
  let commits = await listCommits({
    gitdir,
    start: [oid],
    finish: remote.refs.values()
  })
  let objects = await listObjects({ gitdir, oids: commits })
  let packstream = new stream.PassThrough()
  // TODO: write out pkt-lines:
  // old-oid new-oid ref\0capabilities
  // flush
  packstream.write(encode(`${oid} ${remote.refs.get(ref)} ${ref}`))
  packstream.write(flush())
  git()
    .gitdir('fixtures/test-pack.git')
    .outputStream(packstream)
    .pack(objects)
  let response = await remote.push(packstream)
}
