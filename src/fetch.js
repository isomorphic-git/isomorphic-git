// @flow
import stream from 'stream'
import GitRemoteHTTP from './managers/GitRemoteHTTP'
import { listCommits } from './listCommits'
import { listObjects } from './listObjects'
import { pack } from './pack-objects'
import { resolveRef } from './managers/models/utils/resolveRef'
import { encode, flush } from './managers/models/utils/pkt-line-encoder'

export async function fetch ({ gitdir, ref = 'HEAD', url, auth }) {
  let have = await resolveRef({ gitdir, ref })
  let remote = new GitRemoteHTTP(url)
  remote.auth = auth
  await remote.preparePull()
  let want = remote.refs.get(ref)
  let packstream = new stream.PassThrough()
  packstream.write(encode(`want ${want}\n`))
  packstream.write(encode(`have ${have}\n`))
  packstream.write(flush())

  let response = await remote.pull(packstream)
  return response
}
