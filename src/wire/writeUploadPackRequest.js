import { GitPktLine } from '../models/GitPktLine.js'

export function writeUploadPackRequest({
  capabilities = [],
  wants = [],
  haves = [],
  shallows = [],
  depth = null,
  since = null,
  exclude = [],
}) {
  const packstream = []
  wants = [...new Set(wants)] // remove duplicates
  let firstLineCapabilities = ` ${capabilities.join(' ')}`
  for (const oid of wants) {
    packstream.push(GitPktLine.encode(`want ${oid}${firstLineCapabilities}\n`))
    firstLineCapabilities = ''
  }
  for (const oid of shallows) {
    packstream.push(GitPktLine.encode(`shallow ${oid}\n`))
  }
  if (depth !== null) {
    packstream.push(GitPktLine.encode(`deepen ${depth}\n`))
  }
  if (since !== null) {
    packstream.push(
      GitPktLine.encode(`deepen-since ${Math.floor(since.valueOf() / 1000)}\n`)
    )
  }
  for (const oid of exclude) {
    packstream.push(GitPktLine.encode(`deepen-not ${oid}\n`))
  }
  packstream.push(GitPktLine.flush())
  for (const oid of haves) {
    packstream.push(GitPktLine.encode(`have ${oid}\n`))
  }
  packstream.push(GitPktLine.encode(`done\n`))
  return packstream
}
