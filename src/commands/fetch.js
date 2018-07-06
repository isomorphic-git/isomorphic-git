import path from 'path'
import pify from 'pify'
import concat from 'simple-concat'
import split2 from 'split2'

import { GitRefManager } from '../managers/GitRefManager.js'
import { GitRemoteConnection } from '../managers/GitRemoteConnection.js'
import { GitRemoteManager } from '../managers/GitRemoteManager.js'
import { GitShallowManager } from '../managers/GitShallowManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
import { GitSideBand } from '../models/GitSideBand.js'

import { config } from './config'

/**
 * Fetch commits from a remote repository
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
  noGitSuffix = false,
  authUsername,
  authPassword,
  username = authUsername,
  password = authPassword,
  token,
  oauth2format,
  depth,
  since,
  exclude,
  relative,
  tags,
  singleBranch,
  onprogress // deprecated
}) {
  try {
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
      noGitSuffix,
      username,
      password,
      token,
      oauth2format,
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
    // This is a quick fix for the empty .git/objects/pack/pack-.pack file error,
    // which due to the way `git-list-pack` works causes the program to hang when it tries to read it.
    // TODO: Longer term, we should actually:
    // a) NOT concatenate the entire packfile into memory (line 78),
    // b) compute the SHA of the stream except for the last 20 bytes, using the same library used in push.js, and
    // c) compare the computed SHA with the last 20 bytes of the stream before saving to disk, and throwing a "packfile got corrupted during download" error if the SHA doesn't match.
    if (packfileSha !== '') {
      await fs.write(
        path.join(gitdir, `objects/pack/pack-${packfileSha}.pack`),
        packfile
      )
    }
    // TODO: Return more metadata?
    return {
      defaultBranch: response.HEAD,
      fetchHead: response.FETCH_HEAD
    }
  } catch (err) {
    err.caller = 'git.fetch'
    throw err
  }
}

async function fetchPackfile ({
  gitdir,
  fs: _fs,
  ref,
  refs = [ref],
  remote,
  url,
  noGitSuffix,
  username,
  password,
  token,
  oauth2format,
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
      throw new GitError(E.InvalidDepthParameterError, { depth })
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
  let auth = { username, password, token, oauth2format }
  let GitRemoteHTTP = GitRemoteManager.getRemoteHelperFor({ url })
  let remoteHTTP = await GitRemoteHTTP.discover({
    service: 'git-upload-pack',
    url,
    noGitSuffix,
    auth
  })
  // Check that the remote supports the requested features
  if (depth !== null && !remoteHTTP.capabilities.has('shallow')) {
    throw new GitError(E.RemoteDoesNotSupportShallowFail)
  }
  if (since !== null && !remoteHTTP.capabilities.has('deepen-since')) {
    throw new GitError(E.RemoteDoesNotSupportDeepenSinceFail)
  }
  if (exclude.length > 0 && !remoteHTTP.capabilities.has('deepen-not')) {
    throw new GitError(E.RemoteDoesNotSupportDeepenNotFail)
  }
  if (relative === true && !remoteHTTP.capabilities.has('deepen-relative')) {
    throw new GitError(E.RemoteDoesNotSupportDeepenRelativeFail)
  }
  // Figure out the SHA for the requested ref
  let { oid, fullref } = GitRefManager.resolveAgainstMap({
    ref,
    map: remoteHTTP.refs
  })
  // Assemble the application/x-git-upload-pack-request
  const capabilities = [
    'multi_ack_detailed',
    'no-done',
    'side-band-64k',
    'thin-pack',
    'ofs-delta'
  ]
  if (relative) capabilities.push('deepen-relative')
  // Start requesting oids from the remote by their SHAs
  let wants = singleBranch ? [oid] : remoteHTTP.refs.values()
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
  let oids = await GitShallowManager.read({ fs, gitdir })
  let shallows = remoteHTTP.capabilities.has('shallow') ? [...oids] : []
  let packstream = await GitRemoteConnection.sendUploadPackRequest({
    capabilities,
    wants,
    haves,
    shallows,
    depth,
    since,
    exclude,
    relative
  })
  // CodeCommit will hang up if we don't send a Content-Length header
  // so we can't stream the body.
  packstream = await pify(concat)(packstream)
  let raw = await GitRemoteHTTP.connect({
    service: 'git-upload-pack',
    url,
    noGitSuffix,
    auth,
    stream: packstream
  })
  let response = GitSideBand.demux(raw)
  // Normally I would await this, but for some reason I'm having trouble detecting
  // when this header portion is over.
  GitRemoteConnection.receiveUploadPackResult(response).then(
    async parsedResponse => {
      // Apply all the 'shallow' and 'unshallow' commands
      for (const oid of parsedResponse.shallows) {
        oids.add(oid)
      }
      for (const oid of parsedResponse.unshallows) {
        oids.delete(oid)
      }
      await GitShallowManager.write({ fs, gitdir, oids })
    }
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
