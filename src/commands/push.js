import path from 'path'

import {
  GitRefManager,
  GitRemoteConnection,
  GitRemoteManager
} from '../managers'
import { FileSystem } from '../models'
import { log, pkg } from '../utils'

import { config } from './config'
import { packObjects } from './packObjects'

/**
 * Push a branch
 *
 * @link https://isomorphic-git.github.io/docs/push.html
 */
export async function push ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  emitter,
  ref,
  remote = 'origin',
  url,
  noGitSuffix = false,
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
    let httpRemote = await GitRemoteHTTP.discover({
      service: 'git-receive-pack',
      url,
      noGitSuffix,
      auth
    })
    let oldoid =
      httpRemote.refs.get(fullRef) || '0000000000000000000000000000000000000000'
    let packstream = await GitRemoteConnection.sendReceivePackRequest({
      capabilities: ['report-status', 'side-band-64k', `agent=${pkg.agent}`],
      triplets: [{ oldoid, oid, fullRef }]
    })

    let { packstream: outputStream } = await packObjects({
      gitdir,
      fs,
      refs: [oid],
      exclude: [...httpRemote.refs.values()]
    })
    outputStream.pipe(packstream)

    let res = await GitRemoteHTTP.connect({
      service: 'git-receive-pack',
      url,
      noGitSuffix,
      auth,
      stream: packstream
    })
    let {
      packfile,
      progress
    } = await GitRemoteConnection.receiveMultiplexedStreams(res)
    if (emitter) {
      progress.on('data', chunk => {
        let msg = chunk.toString('utf8')
        emitter.emit('message', msg)
      })
    }
    let result = await GitRemoteConnection.receiveReceivePackResult(packfile)
    log(result)
    return result
  } catch (err) {
    err.caller = 'git.push'
    throw err
  }
}
