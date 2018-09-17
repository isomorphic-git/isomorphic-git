import { PassThrough } from 'stream'

import { GitPktLine } from '../models/GitPktLine.js'

export async function writeUploadPackRequest ({
  capabilities = [],
  wants = [],
  haves = [],
  shallows = [],
  depth = null,
  since = null,
  exclude = [],
  relative = false
}) {
  let packstream = new PassThrough()
  wants = [...new Set(wants)] // remove duplicates
  let firstLineCapabilities = ` ${capabilities.join(' ')}`
  for (const oid of wants) {
    packstream.write(GitPktLine.encode(`want ${oid}${firstLineCapabilities}\n`))
    firstLineCapabilities = ''
  }
  for (const oid of shallows) {
    packstream.write(GitPktLine.encode(`shallow ${oid}\n`))
  }
  if (depth !== null) {
    packstream.write(GitPktLine.encode(`deepen ${depth}\n`))
  }
  if (since !== null) {
    packstream.write(
      GitPktLine.encode(`deepen-since ${Math.floor(since.valueOf() / 1000)}\n`)
    )
  }
  for (const oid of exclude) {
    packstream.write(GitPktLine.encode(`deepen-not ${oid}\n`))
  }
  packstream.write(GitPktLine.flush())
  for (const oid of haves) {
    packstream.write(GitPktLine.encode(`have ${oid}\n`))
  }
  packstream.end(GitPktLine.encode(`done\n`))
  return packstream
}
