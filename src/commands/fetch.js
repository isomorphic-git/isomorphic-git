// @flow
import stream from 'stream'
import { getConfig } from './getConfig'
import { unpack } from './unpack'
import { GitRemoteHTTP, GitRefsManager } from './managers'
import { GitPktLine } from './managers/models'
import { resolveRef, pkg } from './managers/models/utils'

export async function fetch ({ gitdir, ref = 'HEAD', remote, auth }) {
  let have = await resolveRef({ gitdir, ref })
  let url = await getConfig({
    gitdir,
    path: `remote "${remote}".url`
  })
  let remoteHTTP = new GitRemoteHTTP(url)
  remoteHTTP.auth = auth
  await remoteHTTP.preparePull()
  await GitRefsManager.updateRemoteRefs({
    gitdir,
    remote,
    refs: remoteHTTP.refs
  })
  let want = remoteHTTP.refs.get(ref)
  console.log('want =', want)
  console.log('have =', have)
  const capabilities = `multi_ack_detailed no-done side-band-64k thin-pack ofs-delta agent=git/${pkg.name}@${pkg.version}`
  let packstream = new stream.PassThrough()
  packstream.write(GitPktLine.encode(`want ${want} ${capabilities}\n`))
  packstream.write(GitPktLine.flush())
  packstream.write(GitPktLine.encode(`have ${have}\n`))
  packstream.write(GitPktLine.flush())
  packstream.end(GitPktLine.encode(`done\n`))
  let response = await remoteHTTP.pull(packstream)
  // await unpack({gitdir, inputStream: response.packfile})
  return response
}
