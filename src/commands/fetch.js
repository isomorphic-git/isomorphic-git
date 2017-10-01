// @flow
import stream from 'stream'
import { getConfig } from './getConfig'
import { unpack } from './unpack'
import { GitRemoteHTTP, GitRefsManager } from './managers'
import { GitPktLine } from './managers/models'
import { resolveRef, pkg } from './managers/models/utils'

export async function fetchPackfile ({ gitdir, ref = 'HEAD', remote, auth }) {
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
  // Note: I removed "ofs-delta" from the capabilities list and now
  // Github uses all ref-deltas when I fetch packfiles instead of all ofs-deltas. Nice!
  const capabilities = `multi_ack_detailed no-done side-band-64k thin-pack agent=git/${pkg.name}@${pkg.version}`
  let packstream = new stream.PassThrough()
  packstream.write(GitPktLine.encode(`want ${want} ${capabilities}\n`))
  packstream.write(GitPktLine.flush())
  let have = null
  try {
    have = await resolveRef({ gitdir, ref })
    console.log('have =', have)
  } catch (err) {
    console.log("Looks like we don't have that ref yet.")
  }
  if (have) {
    packstream.write(GitPktLine.encode(`have ${have}\n`))
    packstream.write(GitPktLine.flush())
  }
  packstream.end(GitPktLine.encode(`done\n`))
  let response = await remoteHTTP.pull(packstream)
  return response
}

export async function fetch ({ gitdir, ref = 'HEAD', remote, auth }) {
  let response = await fetchPackfile({ gitdir, ref, remote, auth })
  // response.packetlines.pipe(process.stdout)
  response.progress.pipe(process.stdout)
  await unpack({ gitdir, inputStream: response.packfile })
}
