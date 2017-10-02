// @flow
import stream from 'stream'
import thru from 'thru'
import { getConfig } from './getConfig'
import { unpack } from './unpack'
import { GitRemoteHTTP, GitRefsManager, GitShallowManager } from '../managers'
import { GitPktLine } from '../models'
import { resolveRef, pkg } from '../utils'

export async function fetchPackfile ({
  gitdir,
  ref = 'HEAD',
  remote,
  auth,
  depth = 0
}) {
  let url = await getConfig({
    gitdir,
    path: `remote.${remote}.url`
  })
  let remoteHTTP = new GitRemoteHTTP(url)
  remoteHTTP.auth = auth
  await remoteHTTP.preparePull()
  // Check server supports shallow cloning
  if (depth > 0 && !remoteHTTP.capabilities.has('shallow')) {
    throw new Error(`Remote does not support shallow fetching`)
  }
  await GitRefsManager.updateRemoteRefs({
    gitdir,
    remote,
    refs: remoteHTTP.refs
  })
  let want = remoteHTTP.refs.get(ref)
  // Note: I removed "ofs-delta" from the capabilities list and now
  // Github uses all ref-deltas when I fetch packfiles instead of all ofs-deltas. Nice!
  const capabilities = `multi_ack_detailed no-done side-band-64k thin-pack agent=git/${pkg.name}@${pkg.version}`
  let packstream = new stream.PassThrough()
  packstream.write(GitPktLine.encode(`want ${want} ${capabilities}\n`))
  let oids = await GitShallowManager.read({ gitdir })
  if (oids.size > 0 && remoteHTTP.capabilities.has('shallow')) {
    for (let oid of oids) {
      packstream.write(GitPktLine.encode(`shallow ${oid}\n`))
    }
  }
  if (depth !== 0) {
    packstream.write(GitPktLine.encode(`deepen ${parseInt(depth)}\n`))
  }
  packstream.write(GitPktLine.flush())
  let have = null
  try {
    have = await resolveRef({ gitdir, ref })
  } catch (err) {
    console.log("Looks like we don't have that ref yet.")
  }
  if (have) {
    packstream.write(GitPktLine.encode(`have ${have}\n`))
    packstream.write(GitPktLine.flush())
  }
  packstream.end(GitPktLine.encode(`done\n`))
  let response = await remoteHTTP.pull(packstream)
  response.packetlines.pipe(
    thru(async (data, next) => {
      let line = data.toString('utf8')
      if (line.startsWith('shallow')) {
        let oid = line.slice(-41).trim()
        if (oid.length !== 40) {
          throw new Error(`non-40 character 'shallow' oid: ${oid}`)
        }
        oids.add(oid)
        await GitShallowManager.write({ gitdir, oids })
      } else if (line.startsWith('unshallow')) {
        let oid = line.slice(-41).trim()
        if (oid.length !== 40) {
          throw new Error(`non-40 character 'shallow' oid: ${oid}`)
        }
        oids.delete(oid)
        await GitShallowManager.write({ gitdir, oids })
      }
      next(null, data)
    })
  )
  return response
}

export async function fetch ({ gitdir, ref = 'HEAD', remote, auth, depth = 0 }) {
  let response = await fetchPackfile({ gitdir, ref, remote, auth, depth })
  response.progress.on('data', data => console.log(data.toString('utf8')))
  await unpack({ gitdir, inputStream: response.packfile })
}
