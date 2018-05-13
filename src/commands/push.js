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

export async function push ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  emitter,
  ref,
  remote = 'origin',
  url,
  authUsername,
  authPassword
}) {
  const fs = new FileSystem(_fs)
  // TODO: Figure out how pushing tags works. (This only works for branches.)
  if (url === undefined) {
    url = await config({ fs, gitdir, path: `remote.${remote}.url` })
  }
  let fullRef = ref.startsWith('refs/') ? ref : `refs/heads/${ref}`
  let oid = await GitRefManager.resolve({ fs, gitdir, ref })
  let auth
  if (authUsername !== undefined && authPassword !== undefined) {
    auth = {
      username: authUsername,
      password: authPassword
    }
  }
  let GitRemoteHTTP = GitRemoteManager.getRemoteHelperFor({ url })
  let httpRemote = await GitRemoteHTTP.discover({
    service: 'git-receive-pack',
    url,
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
}
