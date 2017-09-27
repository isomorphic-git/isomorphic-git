// @flow
import stream from 'stream'
import GitRemoteHTTP from './managers/GitRemoteHTTP'
import { listCommits } from './listCommits'
import { listObjects } from './listObjects'
import { pack } from './pack-objects'
import { resolveRef } from './managers/models/utils/resolveRef'
import { encode, flush } from './managers/models/utils/pkt-line-encoder'
import { sleep } from './managers/models/utils/sleep'

export async function fetch ({ gitdir, ref = 'HEAD', url, auth }) {
  let have = await resolveRef({ gitdir, ref })
  let remote = new GitRemoteHTTP(url)
  remote.auth = auth
  await remote.preparePull()
  let want = remote.refs.get(ref)
  console.log('want =', want)
  console.log('have =', have)
  let packstream = new stream.PassThrough()
  packstream.write(
    encode(
      `want ${want}\0 multi_ack_detailed no-done side-band-64k thin-pack ofs-delta agent=git/2.10.1.windows.1\n`
    )
  )
  packstream.write(encode(`have ${have}\n`))
  packstream.write(flush())
  packstream.end(encode(`done\n`))
  let response = await remote.pull(packstream)
  return response
}
