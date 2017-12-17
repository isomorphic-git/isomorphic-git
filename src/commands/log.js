import path from 'path'
import { GitRefManager, GitObjectManager } from '../managers'
import { FileSystem, GitCommit } from '../models'

/**
 * @typedef {Object} CommitDescription
 * @property {string} oid - SHA1 object id of this commit
 * @property {string} message - Commit message
 * @property {string} tree - SHA1 object id of corresponding file tree
 * @property {string[]} parent - an array of zero or more SHA1 oids
 * @property {Object} author
 * @property {string} author.name
 * @property {string} author.email
 * @property {number} author.timestamp - UTC Unix timestamp in seconds
 * @property {number} author.timezoneOffset - Timezone difference from UTC in minutes
 * @property {Object} committer
 * @property {string} committer.name
 * @property {string} committer.email
 * @property {number} committer.timestamp - UTC Unix timestamp in seconds
 * @property {number} committer.timezoneOffset - Timezone difference from UTC in minutes
 * @property {string} [gpgsig] - PGP signature (if present)
 */

/**
 * Get commit descriptions from the git history
 *
 * @param {GitRepo} repo - A {@link Git} object matching `{gitdir, fs}`
 * @param {Object} args - Arguments object
 * @param {number} [args.depth=undefined] - Limit the number of commits returned. No limit by default.
 * @param {Date} [args.since=undefined] - Return history newer than the given date. Can be combined with `depth` to get whichever is shorter.
 * @param {string} [args.ref=HEAD] - The commit to begin walking backwards through the history from.
 * @returns {Promise<CommitDescription[]>} - Resolves to an array of {@link CommitDescription} objects
 *
 * @example
 * let repo = new Git({fs, dir: '.'})
 * let commits = await log(repo, {depth: 5, ref: 'master'})
 * console.log(commits)
 */
export async function log ({
  workdir,
  gitdir = path.join(workdir, '.git'),
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
