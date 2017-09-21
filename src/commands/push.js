// @flow
import stream from 'stream'
import GitRemoteHTTP from '../managers/GitRemoteHTTP'
import listCommits from './listCommits'
import listObjects from './listObjects'
import pack from './pack-objects'
import resolveRef from '../utils/resolveRef'
import { encode, flush } from '../utils/pkt-line-encoder'

import path from 'path'
import fs from 'fs'
import sleep from '../utils/sleep'

export default async function push ({ gitdir, ref = 'HEAD', url, auth }) {
  let oid = await resolveRef({ gitdir, ref })
  console.log('ref, oid =', ref, oid)
  let remote = new GitRemoteHTTP(url)
  remote.auth = auth
  await remote.preparePush()
  console.log('remote =', remote)
  let commits = await listCommits({
    gitdir,
    start: [oid],
    finish: remote.refs.values()
  })
  console.log('commits =', commits)
  let objects = await listObjects({ gitdir, oids: commits })
  console.log('objects =', [...objects])
  let packstream = new stream.PassThrough()
  let oldoid =
    remote.refs.get(ref) || '0000000000000000000000000000000000000000'
  console.log('oldoid =', oldoid)
  packstream.write(encode(`${oldoid} ${oid} ${ref}\0 report-status\n`))
  packstream.write(flush())
  pack({
    gitdir,
    oids: [...objects],
    outputStream: packstream
  })
  // packstream.pipe(fs.createWriteStream(path.join(gitdir, 'push.postdata')))
  let response = await remote.push(packstream)
  // await sleep(5000)
  console.log('response =', response)
  // return
  return response
}
