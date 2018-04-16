import path from 'path'
import pify from 'pify'
import concat from 'simple-concat'
import split2 from 'split2'

import {
  GitRefManager,
  GitRemoteConnection,
  GitRemoteManager,
  GitShallowManager
} from '../managers'
import { FileSystem } from '../models'
import { pkg } from '../utils'

import { config } from './config'

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
  // Sanity checks
  if (depth !== null) {
    if (Number.isNaN(parseInt(depth))) {
      throw new Error(`Invalid value for depth argument: ${depth}`)
    }
    depth = parseInt(depth)
  }
  // Set missing values
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
  // Get list of refs from remote
  let GitRemoteHTTP = GitRemoteManager.getRemoteHelperFor({ url })
  let remoteHTTP = await GitRemoteHTTP.discover({
    service: 'git-upload-pack',
    url,
    auth
  })
  // Check that the remote supports the requested features
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
  // Assemble the application/x-git-upload-pack-request
  const capabilities = [
    'multi_ack_detailed',
    'no-done',
    'side-band-64k',
    'thin-pack',
    'ofs-delta',
    `agent=${pkg.agent}`
  ]
  if (relative) capabilities.push('deepen-relative')
  // Figure out the SHA for the requested ref
  let oid = GitRefManager.resolveAgainstMap({
    ref,
    map: remoteHTTP.refs
  })
  // Start requesting oids from the remote by their SHAs
  let wants = singleBranch ? [oid] : remoteHTTP.refs.values()
  wants = [...new Set(wants)] // remove duplicates
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
  let shallows = []
  let oids = await GitShallowManager.read({ fs, gitdir })
  if (remoteHTTP.capabilities.has('shallow')) {
    shallows = [...oids]
  }
  const packstream = await GitRemoteConnection.sendUploadPackRequest({
    capabilities,
    wants,
    haves,
    shallows,
    depth,
    since,
    exclude,
    relative
  })
  let res = await GitRemoteHTTP.connect({
    service: 'git-upload-pack',
    url,
    auth,
    stream: packstream
  })
  let parsedResponse = await GitRemoteConnection.receiveUploadPackResult(res)
  // Apply all the 'shallow' and 'unshallow' commands
  for (const oid of parsedResponse.shallows) {
    oids.add(oid)
  }
  for (const oid of parsedResponse.unshallows) {
    oids.delete(oid)
  }
  await GitShallowManager.write({ fs, gitdir, oids })
  // We need this value later for the `clone` command.
  let HEAD = remoteHTTP.symrefs.get('HEAD')
  let FETCH_HEAD = oid
  return {
    packfile: parsedResponse.packfile,
    progress: parsedResponse.progress,
    HEAD,
    FETCH_HEAD
  }
}
