import path from 'path'

import { GitRefManager } from '../managers/GitRefManager.js'
import { GitRemoteConnection } from '../managers/GitRemoteConnection.js'
import { GitRemoteManager } from '../managers/GitRemoteManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
import { GitSideBand } from '../models/GitSideBand.js'
import { pkg } from '../utils/pkg.js'
import { cores } from '../utils/plugins.js'
import { filterCapabilities } from '../utils/filterCapabilities.js'

import { config } from './config.js'
import { isDescendent } from './isDescendent.js'
import { listCommits } from './listCommits.js'
import { listObjects } from './listObjects.js'
import { pack } from './pack.js'

/**
 * Push a branch or tag
 *
 * @link https://isomorphic-git.github.io/docs/push.html
 */
export async function push ({
  core = 'default',
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  emitter,
  ref,
  remoteRef,
  remote = 'origin',
  url,
  force = false,
  noGitSuffix = false,
  corsProxy,
  authUsername,
  authPassword,
  username = authUsername,
  password = authPassword,
  token,
  oauth2format
}) {
  try {
    const fs = new FileSystem(_fs)
    // TODO: Figure out how pushing tags works. (This only works for branches.)
    if (url === undefined) {
      url = await config({ fs, gitdir, path: `remote.${remote}.url` })
    }
    if (corsProxy === undefined) {
      corsProxy = await config({ fs, gitdir, path: 'http.corsProxy' })
    }
    let fullRef
    if (!ref) {
      fullRef = await GitRefManager.resolve({
        fs,
        gitdir,
        ref: 'HEAD',
        depth: 2
      })
    } else {
      fullRef = await GitRefManager.expand({ fs, gitdir, ref })
    }
    let oid = await GitRefManager.resolve({ fs, gitdir, ref: fullRef })
    let auth = { username, password, token, oauth2format }
    let GitRemoteHTTP = GitRemoteManager.getRemoteHelperFor({ url })
    const httpRemote = await GitRemoteHTTP.discover({
      core,
      corsProxy,
      service: 'git-receive-pack',
      url,
      noGitSuffix,
      auth
    })
    auth = httpRemote.auth // hack to get new credentials from CredentialManager API
    let commits = await listCommits({
      fs,
      gitdir,
      start: [oid],
      finish: httpRemote.refs.values()
    })
    let objects = await listObjects({ fs, gitdir, oids: commits })
    let fullRemoteRef
    if (!remoteRef) {
      fullRemoteRef = fullRef
    } else {
      try {
        fullRemoteRef = await GitRefManager.expandAgainstMap({
          ref: remoteRef,
          map: httpRemote.refs
        })
      } catch (err) {
        if (err.code === E.ExpandRefError) {
          // The remote reference doesn't exist yet.
          // If it is fully specified, use that value. Otherwise, treat it as a branch.
          fullRemoteRef = remoteRef.startsWith('refs/')
            ? remoteRef
            : `refs/heads/${remoteRef}`
        } else {
          throw err
        }
      }
    }
    let oldoid =
      httpRemote.refs.get(fullRemoteRef) ||
      '0000000000000000000000000000000000000000'
    if (!force) {
      // Is it a tag that already exists?
      if (
        fullRef.startsWith('refs/tags') &&
        oldoid !== '0000000000000000000000000000000000000000'
      ) {
        throw new GitError(E.PushRejectedTagExists, {})
      }
      // Is it a non-fast-forward commit?
      if (
        oid !== '0000000000000000000000000000000000000000' &&
        oldoid !== '0000000000000000000000000000000000000000' &&
        !(await isDescendent({ fs, gitdir, oid, ancestor: oldoid }))
      ) {
        throw new GitError(E.PushRejectedNonFastForward, {})
      }
    }
    // We can only safely use capabilities that the server also understands.
    // For instance, AWS CodeCommit aborts a push if you include the `agent`!!!
    const capabilities = filterCapabilities(
      [...httpRemote.capabilities],
      ['report-status', 'side-band-64k', `agent=${pkg.agent}`]
    )
    let packstream = await GitRemoteConnection.sendReceivePackRequest({
      capabilities,
      triplets: [{ oldoid, oid, fullRef: fullRemoteRef }]
    })
    pack({
      fs,
      gitdir,
      oids: [...objects],
      outputStream: packstream
    })
    let { packfile, progress } = await GitSideBand.demux(
      await GitRemoteHTTP.connect({
        corsProxy,
        service: 'git-receive-pack',
        url,
        noGitSuffix,
        auth,
        stream: packstream
      })
    )
    if (emitter) {
      progress.on('data', chunk => {
        let msg = chunk.toString('utf8')
        emitter.emit('message', msg)
      })
    }
    // Parse the response!
    let result = await GitRemoteConnection.receiveReceivePackResult(packfile)
    return result
  } catch (err) {
    err.caller = 'git.push'
    throw err
  }
}
