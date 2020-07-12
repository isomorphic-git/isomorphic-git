import { GitPktLine } from '../models/GitPktLine.js'
import { pkg } from '../utils/pkg.js'

export function writeUploadPackRequestV2({
  capabilities = [],
  wants = [],
  haves = [],
  includeTags = false,
  done = false,
  // feat: shallow
  shallows = [],
  depth = null,
  since = null,
  exclude = [],
  // feat: filter
  filters = [],
}) {
  wants = [...new Set(wants)] // remove duplicates
  const packstream = []
  // command
  packstream.push(GitPktLine.encode('command=ls-refs\n'))
  // capability-list
  packstream.push(GitPktLine.encode(`agent=${pkg.agent}\n`))
  for (const cap of capabilities) {
    packstream.push(GitPktLine.encode(`${cap}\n`))
  }

  // [command-args]
  packstream.push(GitPktLine.delim())
  for (const oid of wants) {
    packstream.push(GitPktLine.encode(`want ${oid}`))
  }
  for (const oid of haves) {
    packstream.push(GitPktLine.encode(`have ${oid}`))
  }

  // I cannot think why we would ever _not_ send this one.
  packstream.push(GitPktLine.encode(`ofs-delta`))

  if (includeTags) packstream.push(GitPktLine.encode(`include-tag`))

  // feat: shallow
  for (const oid of shallows) {
    packstream.push(GitPktLine.encode(`shallow ${oid}`))
  }
  if (depth !== null) {
    packstream.push(GitPktLine.encode(`deepen ${depth}`))
  }
  if (since !== null) {
    packstream.push(
      GitPktLine.encode(`deepen-since ${Math.floor(since.valueOf() / 1000)}`)
    )
  }
  for (const oid of exclude) {
    packstream.push(GitPktLine.encode(`deepen-not ${oid}`))
  }

  // feat: filter
  for (const filterSpec of filters) {
    packstream.push(GitPktLine.encode(`filter ${filterSpec}`))
  }

  // end packfile negotiation
  if (done) packstream.push(GitPktLine.encode(`done`))

  packstream.push(GitPktLine.flush())
  return packstream
}
