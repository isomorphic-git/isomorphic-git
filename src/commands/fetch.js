// @flow
import stream from 'stream'
import thru from 'thru'
import { config } from './config'
import { unpack } from './unpack'
import { GitRemoteHTTP, GitRefsManager, GitShallowManager } from '../managers'
import { GitPktLine } from '../models'
import { resolveRef, pkg } from '../utils'

export async function fetchPackfile ({
  gitdir,
  ref,
  remote,
  url,
  authUsername,
  authPassword,
  depth = 0
}) {
  depth = parseInt(depth)
  remote = remote || 'origin'
  if (url === undefined) {
    url = await config({
      gitdir,
      path: `remote.${remote}.url`
    })
  }
  let remoteHTTP = new GitRemoteHTTP(url)
  if (authUsername !== undefined && authPassword !== undefined) {
    remoteHTTP.auth = {
      username: authUsername,
      password: authPassword
    }
  }
  await remoteHTTP.preparePull()
  // Check server supports shallow cloning
  if (depth > 0 && !remoteHTTP.capabilities.has('shallow')) {
    throw new Error(`Remote does not support shallow fetching`)
  }
  await GitRefsManager.updateRemoteRefs({
    gitdir,
    remote,
    refs: remoteHTTP.refs,
    symrefs: remoteHTTP.symrefs
  })
  let want = await resolveRef({ gitdir, ref: `refs/remotes/${remote}/${ref}` })
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
  } catch (err) {}
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

export async function fetch ({
  gitdir,
  ref = 'HEAD',
  remote,
  url,
  authUsername,
  authPassword,
  depth = 0
}) {
  let response = await fetchPackfile({
    gitdir,
    ref,
    remote,
    url,
    authUsername,
    authPassword,
    depth
  })
  response.progress.on('data', data => console.log(data.toString('utf8')))
  await unpack({ gitdir, inputStream: response.packfile })
}
