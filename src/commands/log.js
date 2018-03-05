import path from 'path'
import { GitRefManager, GitObjectManager } from '../managers'
import { FileSystem, GitCommit } from '../models'

export async function log ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  ref = 'HEAD',
  depth,
  since // Date
}) {
  const fs = new FileSystem(_fs)
  let sinceTimestamp =
    since === undefined ? undefined : Math.floor(since.valueOf() / 1000)
  // TODO: In the future, we may want to have an API where we return a
  // async iterator that emits commits.
  let commits = []
  let start = await GitRefManager.resolve({ fs, gitdir, ref })
  let { type, object } = await GitObjectManager.read({ fs, gitdir, oid: start })
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
      gitobject = await GitObjectManager.read({ fs, gitdir, oid })
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
