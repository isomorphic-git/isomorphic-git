import { PassThrough } from 'stream'
import through2 from 'through2'

import { config } from '../commands'
import { GitRefManager, GitRemoteManager, GitShallowManager } from '../managers'
import { FileSystem, GitPktLine } from '../models'
import { pkg } from '../utils'

export async function fetchPackfile ({
  gitdir,
  fs: _fs,
  ref,
  refs = [ref],
  remote,
  url,
  authUsername,
  authPassword,
  depth = null,
  since = null,
  exclude = [],
  relative = false,
  tags = false,
  singleBranch = false
}) {
  const fs = new FileSystem(_fs)
  if (depth !== null) {
    if (Number.isNaN(parseInt(depth))) {
      throw new Error(`Invalid value for depth argument: ${depth}`)
    }
    depth = parseInt(depth)
  }
  remote = remote || 'origin'
  if (url === undefined) {
    url = await config({
      fs,
      gitdir,
      path: `remote.${remote}.url`
    })
  }
  let auth
  if (authUsername !== undefined && authPassword !== undefined) {
    auth = {
      username: authUsername,
      password: authPassword
    }
  }
  let GitRemoteHTTP = GitRemoteManager.getRemoteHelperFor({ url })
  let remoteHTTP = await GitRemoteHTTP.discover({
    service: 'git-upload-pack',
    url,
    auth
  })
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
  // Figure out the SHA for the requested ref
  let { oid, fullref } = GitRefManager.resolveAgainstMap({
    ref,
    map: remoteHTTP.refs
  })
  // Assemble packfile request
  const capabilities = `multi_ack_detailed no-done side-band-64k thin-pack ofs-delta agent=git/${
    pkg.name
  }@${pkg.version}${relative ? ' deepen-relative' : ''}`
  let packstream = new PassThrough()
  // Start requesting oids from the remote by their SHAs
  let wants = singleBranch ? [oid] : remoteHTTP.refs.values()
  wants = [...new Set(wants)] // remove duplicates
  let firstLineCapabilities = ` ${capabilities}`
  for (const want of wants) {
    packstream.write(
      GitPktLine.encode(`want ${want}${firstLineCapabilities}\n`)
    )
    firstLineCapabilities = ''
  }
  let oids = await GitShallowManager.read({ fs, gitdir })
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
  let haves = []
  for (let ref of refs) {
    try {
      ref = await GitRefManager.expand({ fs, gitdir, ref })
      // TODO: Actually, should we test whether we have the object using readObject?
      if (!ref.startsWith('refs/tags')) {
        let have = await GitRefManager.resolve({ fs, gitdir, ref })
        haves.push(have)
      }
    } catch (err) {}
  }
  for (const have of haves) {
    packstream.write(GitPktLine.encode(`have ${have}\n`))
  }
  packstream.write(GitPktLine.flush())
  packstream.end(GitPktLine.encode(`done\n`))
  let response = await GitRemoteHTTP.connect({
    service: 'git-upload-pack',
    url,
    auth,
    stream: packstream
  })
  // Apply all the 'shallow' and 'unshallow' commands
  response.packetlines.pipe(
    through2(async (data, enc, next) => {
      let line = data.toString('utf8')
      if (line.startsWith('shallow')) {
        let oid = line.slice(-41).trim()
        if (oid.length !== 40) {
          throw new Error(`non-40 character 'shallow' oid: ${oid}`)
        }
        oids.add(oid)
        await GitShallowManager.write({ fs, gitdir, oids })
      } else if (line.startsWith('unshallow')) {
        let oid = line.slice(-41).trim()
        if (oid.length !== 40) {
          throw new Error(`non-40 character 'shallow' oid: ${oid}`)
        }
        oids.delete(oid)
        await GitShallowManager.write({ fs, gitdir, oids })
      }
      next(null, data)
    })
  )
  // Update local remote refs
  if (singleBranch) {
    const refs = new Map([[fullref, oid]])
    // But wait, maybe it was a symref, like 'HEAD'!
    // We need to save all the refs in the symref chain (sigh).
    const symrefs = new Map()
    let bail = 10
    let key = fullref
    while (bail--) {
      let value = remoteHTTP.symrefs.get(key)
      if (value === undefined) break
      symrefs.set(key, value)
      key = value
    }
    // final value must not be a symref but a real ref
    refs.set(key, remoteHTTP.refs.get(key))
    await GitRefManager.updateRemoteRefs({
      fs,
      gitdir,
      remote,
      refs,
      symrefs,
      tags
    })
  } else {
    await GitRefManager.updateRemoteRefs({
      fs,
      gitdir,
      remote,
      refs: remoteHTTP.refs,
      symrefs: remoteHTTP.symrefs,
      tags
    })
  }
  // We need this value later for the `clone` command.
  response.HEAD = remoteHTTP.symrefs.get('HEAD')
  response.FETCH_HEAD = oid
  return response
}
