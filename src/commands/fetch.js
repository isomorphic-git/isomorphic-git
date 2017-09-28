// @flow
import stream from 'stream'
import { GitRemoteHTTP } from './managers'
import { GitPktLine } from './managers/models'
import { resolveRef, pkg } from './managers/models/utils'

export async function fetch ({ gitdir, ref = 'HEAD', url, auth }) {
  let have = await resolveRef({ gitdir, ref })
  let remote = new GitRemoteHTTP(url)
  remote.auth = auth
  await remote.preparePull()
  let want = remote.refs.get(ref)
  console.log('want =', want)
  console.log('have =', have)
  const capabilities = `multi_ack_detailed no-done side-band-64k thin-pack ofs-delta agent=git/${pkg.name}@${pkg.version}`
  let packstream = new stream.PassThrough()
  packstream.write(GitPktLine.encode(`want ${want} ${capabilities}\n`))
  packstream.write(GitPktLine.flush())
  packstream.write(GitPktLine.encode(`have ${have}\n`))
  packstream.write(GitPktLine.flush())
  packstream.end(GitPktLine.encode(`done\n`))
  let response = await remote.pull(packstream)
  return response
}
