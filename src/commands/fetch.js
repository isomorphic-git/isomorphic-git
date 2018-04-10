import path from 'path'
import { PassThrough } from 'stream'
import through2 from 'through2'
import pify from 'pify'
import concat from 'simple-concat'
import split2 from 'split2'
import { config } from './config'
import { GitRemoteHTTP, GitRefManager, GitShallowManager } from '../managers'
import { FileSystem, GitPktLine } from '../models'
import { pkg } from '../utils'

/**
 * Fetch commits
 *
 * @link https://isomorphic-git.github.io/docs/fetch.html
 */
export async function fetch ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  emitter,
  ref = 'HEAD',
  refs,
  remote,
  url,
  authUsername,
  authPassword,
  depth,
  since,
  exclude,
  relative,
  tags,
  singleBranch,
  onprogress // deprecated
}) {
  if (onprogress !== undefined) {
    console.warn(
      'The `onprogress` callback has been deprecated. Please use the more generic `emitter` EventEmitter argument instead.'
    )
  }
  const fs = new FileSystem(_fs)
  let response = await fetchPackfile({
    gitdir,
    fs,
    ref,
    refs,
    remote,
    url,
    authUsername,
    authPassword,
    depth,
    since,
    exclude,
    relative,
    tags,
    singleBranch
  })
  // Note: progress messages are designed to be written directly to the terminal,
  // so they are often sent with just a carriage return to overwrite the last line of output.
  // But there are also messages delimited with newlines.
  // I also include CRLF just in case.
  response.progress.pipe(split2(/(\r\n)|\r|\n/)).on('data', line => {
    if (emitter) {
      emitter.emit('message', line.trim())
    }
    let matches = line.match(/\((\d+?)\/(\d+?)\)/)
    if (matches && emitter) {
      emitter.emit('progress', {
        loaded: parseInt(matches[1], 10),
        total: parseInt(matches[2], 10),
        lengthComputable: true
      })
    }
  })
  let packfile = await pify(concat)(response.packfile)
  let packfileSha = packfile.slice(-20).toString('hex')
  await fs.write(
    path.join(gitdir, `objects/pack/pack-${packfileSha}.pack`),
    packfile
  )
  // TODO: Return more metadata?
  return {
    defaultBranch: response.HEAD,
    fetchHead: response.FETCH_HEAD
  }
}

async function fetchPackfile ({
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
  let remoteHTTP = await GitRemoteHTTP.preparePull({ url, auth })
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
  // TODO: Don't add other refs if singleBranch is specified.
  await GitRefManager.updateRemoteRefs({
    fs,
    gitdir,
    remote,
    refs: remoteHTTP.refs,
    symrefs: remoteHTTP.symrefs,
    tags
  })
  const capabilities = `multi_ack_detailed no-done side-band-64k thin-pack ofs-delta agent=git/${
    pkg.name
  }@${pkg.version}${relative ? ' deepen-relative' : ''}`
  let packstream = new PassThrough()
  // Figure out the SHA for the requested ref
  let oid = GitRefManager.resolveAgainstMap({
    ref,
    map: remoteHTTP.refs
  })
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
  let response = await GitRemoteHTTP.pull({ url, auth, stream: packstream })
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
  // We need this value later for the `clone` command.
  response.HEAD = remoteHTTP.symrefs.get('HEAD')
  response.FETCH_HEAD = oid
  return response
}
