import path from 'path'
import pify from 'pify'
import concat from 'simple-concat'
import split2 from 'split2'
import { PassThrough } from 'stream'
import through2 from 'through2'

import { GitRefManager, GitRemoteManager, GitShallowManager } from '../managers'
import { E, FileSystem, GitError, GitPktLine } from '../models'

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
  const capabilities = `multi_ack_detailed no-done side-band-64k thin-pack ofs-delta${
    relative ? ' deepen-relative' : ''
  }`
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
    noGitSuffix,
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
          throw new GitError(E.CorruptShallowOidFail, { oid })
        }
        oids.add(oid)
        await GitShallowManager.write({ fs, gitdir, oids })
      } else if (line.startsWith('unshallow')) {
        let oid = line.slice(-41).trim()
        if (oid.length !== 40) {
          throw new GitError(E.CorruptShallowOidFail, { oid })
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
