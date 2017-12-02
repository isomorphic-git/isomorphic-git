// @flow
import stream from 'stream'
import { config } from './config'
import { pack } from './pack'
import { listCommits } from './listCommits'
import { listObjects } from './listObjects'
import { GitRefManager, GitObjectManager, GitRemoteHTTP } from '../managers'
import { GitCommit, GitTree, GitPktLine } from '../models'
import { fs as defaultfs, setfs } from '../utils'

export async function push (
  { gitdir, fs = defaultfs() },
  { ref, remote, url, authUsername, authPassword }
) {
  setfs(fs)
  // TODO: Figure out how pushing tags works. (This only works for branches.)
  remote = remote || 'origin'
  if (url === undefined) {
    url = await config(
      {
        gitdir
      },
      {
        path: `remote.${remote}.url`
      }
    )
  }
  let fullRef = ref.startsWith('refs/') ? ref : `refs/heads/${ref}`
  let oid = await GitRefManager.resolve({ gitdir, ref })
  let httpRemote = new GitRemoteHTTP(url)
  if (authUsername !== undefined && authPassword !== undefined) {
    httpRemote.auth = {
      username: authUsername,
      password: authPassword
    }
  }
  await httpRemote.preparePush()
  let commits = await listCommits(
    {
      gitdir,
      fs
    },
    {
      start: [oid],
      finish: httpRemote.refs.values()
    }
  )
  let objects = await listObjects({ gitdir, fs }, { oids: commits })
  let packstream = new stream.PassThrough()
  let oldoid =
    httpRemote.refs.get(fullRef) || '0000000000000000000000000000000000000000'
  packstream.write(
    GitPktLine.encode(`${oldoid} ${oid} ${fullRef}\0 report-status\n`)
  )
  packstream.write(GitPktLine.flush())
  pack(
    {
      gitdir,
      fs
    },
    {
      oids: [...objects],
      outputStream: packstream
    }
  )
  let response = await httpRemote.push(packstream)
  return response
}
