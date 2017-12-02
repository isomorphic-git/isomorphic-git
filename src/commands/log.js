// @flow
import { GitRefManager, GitObjectManager } from '../managers'
import { GitCommit } from '../models'
import { fs as defaultfs, setfs } from '../utils'

export async function log (
  { gitdir, fs = defaultfs() },
  {
    ref = 'HEAD',
    depth,
    since // Date
  }
) {
  setfs(fs)
  let sinceTimestamp =
    since === undefined ? undefined : Math.floor(since.valueOf() / 1000)
  // TODO: In the future, we may want to have an API where we return a
  // async iterator that emits commits.
  let commits = []
  let start = await GitRefManager.resolve({ gitdir, ref })
  let { type, object } = await GitObjectManager.read({ gitdir, oid: start })
  if (type !== 'commit') {
    throw new Error(
      `The given ref ${ref} did not resolve to a commit but to a ${type}`
    )
  }
  let currentCommit = { oid: start, ...GitCommit.from(object).parse() }
  commits.push(currentCommit)
  while (true) {
    if (depth !== undefined && commits.length === depth) break
    if (currentCommit.parent.length === 0) break
    let oid = currentCommit.parent[0]
    let gitobject
    try {
      gitobject = await GitObjectManager.read({ gitdir, oid })
    } catch (err) {
      commits.push({
        oid,
        error: err
      })
      break
    }
    let { type, object } = gitobject
    if (type !== 'commit') {
      commits.push({
        oid,
        error: new Error(`Invalid commit parent ${oid} is of type ${type}`)
      })
      break
    }
    currentCommit = { oid, ...GitCommit.from(object).parse() }
    if (
      sinceTimestamp !== undefined &&
      currentCommit.author.timestamp <= sinceTimestamp
    ) {
      break
    }
    commits.push(currentCommit)
  }
  return commits
}
