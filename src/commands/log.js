import path from 'path'

import { GitObjectManager, GitRefManager } from '../managers'
import { FileSystem, GitCommit } from '../models'

export async function log ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  ref = 'HEAD',
  depth,
  since, // Date
  signing = false
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
  let commit = GitCommit.from(object)
  let currentCommit = { oid: start, ...commit.parse() }
  if (signing) {
    currentCommit.payload = commit.withoutSignature()
  }
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
    commit = GitCommit.from(object)
    currentCommit = { oid, ...commit.parse() }
    if (signing) {
      currentCommit.payload = commit.withoutSignature()
    }
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
