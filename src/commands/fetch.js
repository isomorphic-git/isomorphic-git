import { GitRefManager } from '../managers/GitRefManager.js'
import { GitRemoteManager } from '../managers/GitRemoteManager.js'
import { GitShallowManager } from '../managers/GitShallowManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
import { GitPackIndex } from '../models/GitPackIndex.js'
import { readObject } from '../storage/readObject.js'
import { collect } from '../utils/collect.js'
import { filterCapabilities } from '../utils/filterCapabilities.js'
import { forAwait } from '../utils/forAwait.js'
import { join } from '../utils/join.js'
import { pkg } from '../utils/pkg.js'
import { cores } from '../utils/plugins.js'
import { splitLines } from '../utils/splitLines.js'
import { parseUploadPackResponse } from '../wire/parseUploadPackResponse.js'
import { writeUploadPackRequest } from '../wire/writeUploadPackRequest.js'

import { config } from './config'

/**
 * Fetch commits from a remote repository
 *
 * @link https://isomorphic-git.github.io/docs/fetch.html
 */
export async function fetch ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  emitter = cores.get(core).get('emitter'),
  emitterPrefix = '',
  ref = 'HEAD',
  refs,
  remote,
  url,
  noGitSuffix = false,
  corsProxy,
  authUsername,
  authPassword,
  username = authUsername,
  password = authPassword,
  token,
  oauth2format,
  depth = null,
  since = null,
  exclude = [],
  relative = false,
  tags = false,
  singleBranch = false,
  headers = {},
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
      core,
      gitdir,
      fs,
      emitter,
      emitterPrefix,
      ref,
      refs,
      remote,
      url,
      noGitSuffix,
      corsProxy,
      username,
      password,
      token,
      oauth2format,
      depth,
      since,
      exclude,
      relative,
      tags,
      singleBranch,
      headers
    })
    if (response === null) {
      return {
        fetchHead: null
      }
    }
    if (emitter) {
      let lines = splitLines(response.progress)
      forAwait(lines, line => {
        // As a historical accident, 'message' events were trimmed removing valuable information,
        // such as \r by itself which was a single to update the existing line instead of appending a new one.
        // TODO NEXT BREAKING RELEASE: make 'message' behave like 'rawmessage' and remove 'rawmessage'.
        emitter.emit(`${emitterPrefix}message`, line.trim())
        emitter.emit(`${emitterPrefix}rawmessage`, line)
        let matches = line.match(/([^:]*).*\((\d+?)\/(\d+?)\)/)
        if (matches) {
          emitter.emit(`${emitterPrefix}progress`, {
            phase: matches[1].trim(),
            loaded: parseInt(matches[2], 10),
            total: parseInt(matches[3], 10),
            lengthComputable: true
          })
        }
      })
    }
    let packfile = await collect(response.packfile)
    let packfileSha = packfile.slice(-20).toString('hex')
    // TODO: Return more metadata?
    let res = {
      defaultBranch: response.HEAD,
      fetchHead: response.FETCH_HEAD
    }
    if (response.headers) {
      res.headers = response.headers
    }
    // This is a quick fix for the empty .git/objects/pack/pack-.pack file error,
    // which due to the way `git-list-pack` works causes the program to hang when it tries to read it.
    // TODO: Longer term, we should actually:
    // a) NOT concatenate the entire packfile into memory (line 78),
    // b) compute the SHA of the stream except for the last 20 bytes, using the same library used in push.js, and
    // c) compare the computed SHA with the last 20 bytes of the stream before saving to disk, and throwing a "packfile got corrupted during download" error if the SHA doesn't match.
    if (packfileSha !== '') {
      res.packfile = `objects/pack/pack-${packfileSha}.pack`
      const fullpath = join(gitdir, res.packfile)
      await fs.write(fullpath, packfile)
      const getExternalRefDelta = oid => readObject({ fs, gitdir, oid })
      const idx = await GitPackIndex.fromPack({
        pack: packfile,
        getExternalRefDelta,
        emitter,
        emitterPrefix
      })
      await fs.write(fullpath.replace(/\.pack$/, '.idx'), idx.toBuffer())
    }
    return res
  } catch (err) {
    err.caller = 'git.fetch'
    throw err
  }
}

async function fetchPackfile ({
  core,
  gitdir,
  fs: _fs,
  emitter,
  emitterPrefix,
  ref,
  refs = [ref],
  remote,
  url,
  noGitSuffix,
  corsProxy,
  username,
  password,
  token,
  oauth2format,
  depth,
  since,
  exclude,
  relative,
  tags,
  singleBranch,
  headers
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
  if (corsProxy === undefined) {
    corsProxy = await config({ fs, gitdir, path: 'http.corsProxy' })
  }
  let auth = { username, password, token, oauth2format }
  let GitRemoteHTTP = GitRemoteManager.getRemoteHelperFor({ url })
  let remoteHTTP = await GitRemoteHTTP.discover({
    core,
    corsProxy,
    service: 'git-upload-pack',
    url,
    noGitSuffix,
    auth,
    headers
  })
  auth = remoteHTTP.auth // hack to get new credentials from CredentialManager API
  const remoteRefs = remoteHTTP.refs
  // For the special case of an empty repository with no refs, return null.
  if (remoteRefs.size === 0) {
    return null
  }
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
    map: remoteRefs
  })
  // Filter out refs we want to ignore: only keep ref we're cloning, HEAD, branches, and tags (if we're keeping them)
  for (let remoteRef of remoteRefs.keys()) {
    if (
      remoteRef === fullref ||
      remoteRef === 'HEAD' ||
      remoteRef.startsWith('refs/heads/') ||
      (tags && remoteRef.startsWith('refs/tags/'))
    ) {
      continue
    }
    remoteRefs.delete(remoteRef)
  }
  // Assemble the application/x-git-upload-pack-request
  const capabilities = filterCapabilities(
    [...remoteHTTP.capabilities],
    [
      'multi_ack_detailed',
      'no-done',
      'side-band-64k',
      'thin-pack',
      'ofs-delta',
      `agent=${pkg.agent}`
    ]
  )
  if (relative) capabilities.push('deepen-relative')
  // Start requesting oids from the remote by their SHAs
  let wants = singleBranch ? [oid] : remoteRefs.values()
  let haves = []
  for (let ref of refs) {
    try {
      ref = await GitRefManager.expand({ fs, gitdir, ref })
      // TODO: Actually, should we test whether we have the object using readObject?
      if (!ref.startsWith('refs/tags/')) {
        let have = await GitRefManager.resolve({ fs, gitdir, ref })
        haves.push(have)
      }
    } catch (err) {}
  }
  let oids = await GitShallowManager.read({ fs, gitdir })
  let shallows = remoteHTTP.capabilities.has('shallow') ? [...oids] : []
  let packstream = writeUploadPackRequest({
    capabilities,
    wants,
    haves,
    shallows,
    depth,
    since,
    exclude
  })
  // CodeCommit will hang up if we don't send a Content-Length header
  // so we can't stream the body.
  let packbuffer = await collect(packstream)
  let raw = await GitRemoteHTTP.connect({
    core,
    emitter,
    emitterPrefix,
    corsProxy,
    service: 'git-upload-pack',
    url,
    noGitSuffix,
    auth,
    body: [packbuffer],
    headers
  })
  let response = await parseUploadPackResponse(raw.body)
  if (raw.headers) {
    response.headers = raw.headers
  }
  // Apply all the 'shallow' and 'unshallow' commands
  for (const oid of response.shallows) {
    oids.add(oid)
  }
  for (const oid of response.unshallows) {
    oids.delete(oid)
  }
  await GitShallowManager.write({ fs, gitdir, oids })
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
    refs.set(key, remoteRefs.get(key))
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
      refs: remoteRefs,
      symrefs: remoteHTTP.symrefs,
      tags
    })
  }
  // We need this value later for the `clone` command.
  response.HEAD = remoteHTTP.symrefs.get('HEAD')
  // AWS CodeCommit doesn't list HEAD as a symref, but we can reverse engineer it
  // Find the SHA of the branch called HEAD
  if (response.HEAD === undefined) {
    let { oid } = GitRefManager.resolveAgainstMap({
      ref: 'HEAD',
      map: remoteRefs
    })
    // Use the name of the first branch that's not called HEAD that has
    // the same SHA as the branch called HEAD.
    for (let [key, value] of remoteRefs.entries()) {
      if (key !== 'HEAD' && value === oid) {
        response.HEAD = key
        break
      }
    }
  }
  response.FETCH_HEAD = oid
  return response
}
