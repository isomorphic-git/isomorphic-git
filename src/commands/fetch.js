// @flow
import stream from 'stream'
import thru from 'thru'
import { config } from './config'
import { unpack } from './unpack'
import { GitRemoteHTTP, GitRefManager, GitShallowManager } from '../managers'
import { GitPktLine } from '../models'
import { pkg } from '../utils'

export async function fetchPackfile ({
  gitdir,
  ref,
  remote,
  url,
  authUsername,
  authPassword,
  depth = null,
  since = null,
  exclude = [],
  relative = false
}) {
  if (depth !== null) {
    if (Number.isNaN(parseInt(depth))) {
      throw new Error(`Invalid value for depth argument: ${depth}`)
    }
    depth = parseInt(depth)
  }
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
  if (depth !== null && !remoteHTTP.capabilities.has('shallow')) {
    throw new Error(`Remote does not support shallow fetches`)
  }
  if (since !== null && !remoteHTTP.capabilities.has('deepen-since')) {
    throw new Error(`Remote does not support shallow fetches by date`)
  }
  if (exclude.length > 0 && !remoteHTTP.capabilities.has('deepen-not')) {
    throw new Error(
      `Remote does not support shallow fetches excluding commits reachable by refs`
    )
  }
  if (relative === true && !remoteHTTP.capabilities.has('deepen-relative')) {
    throw new Error(
      `Remote does not support shallow fetches relative to the current shallow depth`
    )
  }
  await GitRefManager.updateRemoteRefs({
    gitdir,
    remote,
    refs: remoteHTTP.refs,
    symrefs: remoteHTTP.symrefs
  })
  let want = await GitRefManager.resolve({
    gitdir,
    ref: `refs/remotes/${remote}/${ref}`
  })
  // Note: I removed "ofs-delta" from the capabilities list and now
  // Github uses all ref-deltas when I fetch packfiles instead of all ofs-deltas. Nice!
  const capabilities = `multi_ack_detailed no-done side-band-64k thin-pack agent=git/${pkg.name}@${pkg.version}${relative
    ? ' deepen-relative'
    : ''}`
  let packstream = new stream.PassThrough()
  packstream.write(GitPktLine.encode(`want ${want} ${capabilities}\n`))
  let oids = await GitShallowManager.read({ gitdir })
  if (oids.size > 0 && remoteHTTP.capabilities.has('shallow')) {
    for (let oid of oids) {
      packstream.write(GitPktLine.encode(`shallow ${oid}\n`))
    }
  }
  if (depth !== null) {
    packstream.write(GitPktLine.encode(`deepen ${depth}\n`))
  }
  if (since !== null) {
    packstream.write(
      GitPktLine.encode(`deepen-since ${Math.floor(since.valueOf() / 1000)}\n`)
    )
  }
  for (let x of exclude) {
    packstream.write(GitPktLine.encode(`deepen-not ${x}\n`))
  }
  packstream.write(GitPktLine.flush())
  let have = null
  try {
    have = await GitRefManager.resolve({ gitdir, ref })
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
  depth,
  since,
  exclude,
  relative,
  onprogress
}) {
  let response = await fetchPackfile({
    gitdir,
    ref,
    remote,
    url,
    authUsername,
    authPassword,
    depth,
    since,
    exclude,
    relative
  })
  await unpack({ gitdir, inputStream: response.packfile, onprogress })
}
