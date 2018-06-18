import path from 'path'
import { PassThrough } from 'stream'

import { GitRefManager, GitRemoteManager } from '../managers'
import { FileSystem, GitPktLine } from '../models'
import { log, pkg } from '../utils'

import { config } from './config'
import { listCommits } from './listCommits'
import { listObjects } from './listObjects'
import { pack } from './pack'

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
      ref = await GitRefManager.resolve({ fs, gitdir, ref: 'HEAD', depth: 1 })
      fullRef = ref.replace(/^ref: /, '')
    } else {
      fullRef = ref.startsWith('refs/') ? ref : `refs/heads/${ref}`
    }
    let oid = await GitRefManager.resolve({ fs, gitdir, ref })
    let auth = { username, password, token, oauth2format }
    let GitRemoteHTTP = GitRemoteManager.getRemoteHelperFor({ url })
    let httpRemote = await GitRemoteHTTP.discover({
      service: 'git-receive-pack',
      url,
      noGitSuffix,
      auth
    })
    let commits = await listCommits({
      fs,
      gitdir,
      start: [oid],
      finish: httpRemote.refs.values()
    })
    let objects = await listObjects({ fs, gitdir, oids: commits })
    let packstream = new PassThrough()
    let oldoid =
      httpRemote.refs.get(fullRef) || '0000000000000000000000000000000000000000'
    const capabilities = `report-status side-band-64k agent=git/${pkg.name}@${
      pkg.version
    }`
    packstream.write(
      GitPktLine.encode(`${oldoid} ${oid} ${fullRef}\0 ${capabilities}\n`)
    )
    packstream.write(GitPktLine.flush())
    pack({
      fs,
      gitdir,
      oids: [...objects],
      outputStream: packstream
    })
    let { packfile, progress } = await GitRemoteHTTP.connect({
      service: 'git-receive-pack',
      url,
      noGitSuffix,
      auth,
      stream: packstream
    })
    if (emitter) {
      progress.on('data', chunk => {
        let msg = chunk.toString('utf8')
        emitter.emit('message', msg)
      })
    }
    let result = {}
    // Parse the response!
    let response = ''
    let read = GitPktLine.streamReader(packfile)
    let line = await read()
    while (line !== true) {
      if (line !== null) response += line.toString('utf8') + '\n'
      line = await read()
    }

    let lines = response.toString('utf8').split('\n')
    // We're expecting "unpack {unpack-result}"
    line = lines.shift()
    if (!line.startsWith('unpack ')) {
      throw new Error(
        `Unparsable response from server! Expected 'unpack ok' or 'unpack [error message]' but got '${line}'`
      )
    }
    if (line === 'unpack ok') {
      result.ok = ['unpack']
    } else {
      result.errors = [line.trim()]
    }
    for (let line of lines) {
      let status = line.slice(0, 2)
      let refAndMessage = line.slice(3)
      if (status === 'ok') {
        result.ok = result.ok || []
        result.ok.push(refAndMessage)
      } else if (status === 'ng') {
        result.errors = result.errors || []
        result.errors.push(refAndMessage)
      }
    }
    log(result)
    return result
  } catch (err) {
    err.caller = 'git.push'
    throw err
  }
}
