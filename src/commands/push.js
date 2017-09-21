// @flow
import stream from 'stream'
import GitRemoteHTTP from '../managers/GitRemoteHTTP'
import listCommits from './listCommits'
import listObjects from './listObjects'
import pack from './pack-objects'
import resolveRef from '../utils/resolveRef'
import { encode, flush } from '../utils/pkt-line-encoder'

export default async function push ({ gitdir, ref = 'HEAD', url, auth }) {
  let oid = await resolveRef({ gitdir, ref })
  let remote = new GitRemoteHTTP(url)
  remote.auth = auth
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
  packstream.write(encode(`${oldoid} ${oid} ${ref}\0 report-status\n`))
  packstream.write(flush())
  pack({
    gitdir,
    oids: [...objects],
    outputStream: packstream
  })
  let response = await remote.push(packstream)
  return response
}
