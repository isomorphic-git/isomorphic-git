// @flow
import stream from 'stream'
import { GitRemoteHTTP } from '../managers'
import { listCommits } from './listCommits'
import { listObjects } from './listObjects'
import { pack } from './pack'
import { GitPktLine } from '../models'
import { resolveRef } from '../utils'

export async function push ({
  gitdir,
  ref = 'HEAD',
  url,
  authUsername,
  authPassword
}) {
  let oid = await resolveRef({ gitdir, ref })
  let remote = new GitRemoteHTTP(url)
  if (authUsername !== undefined && authPassword !== undefined) {
    remote.auth = {
      username: authUsername,
      password: authPassword
    }
  }
  await remote.preparePush()
  let commits = await listCommits({
    gitdir,
    start: [oid],
    finish: remote.refs.values()
  })
  let objects = await listObjects({ gitdir, oids: commits })
  let packstream = new stream.PassThrough()
  let oldoid =
    remote.refs.get(ref) || '0000000000000000000000000000000000000000'
  packstream.write(
    GitPktLine.encode(`${oldoid} ${oid} ${ref}\0 report-status\n`)
  )
  packstream.write(GitPktLine.flush())
  pack({
    gitdir,
    oids: [...objects],
    outputStream: packstream
  })
  let response = await remote.push(packstream)
  return response
}
