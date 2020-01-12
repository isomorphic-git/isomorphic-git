// @ts-check
import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'
import { resolveCommit } from '../utils/resolveCommit.js'

/**
 *
 * @typedef {Object} ReadCommitResult - The object returned has the following schema:
 * @property {string} oid - SHA-1 object id of this commit
 * @property {CommitObject} commit - the parsed commit object
 * @property {string} payload - PGP signing payload
 */

/**
 *
 * @typedef {Object} CommitObject
 * @property {string} message - Commit message
 * @property {string} tree - SHA-1 object id of corresponding file tree
 * @property {string[]} parent - an array of zero or more SHA-1 object ids
 * @property {Object} author
 * @property {string} author.name - The author's name
 * @property {string} author.email - The author's email
 * @property {number} author.timestamp - UTC Unix timestamp in seconds
 * @property {number} author.timezoneOffset - Timezone difference from UTC in minutes
 * @property {Object} committer
 * @property {string} committer.name - The committer's name
 * @property {string} committer.email - The committer's email
 * @property {number} committer.timestamp - UTC Unix timestamp in seconds
 * @property {number} committer.timezoneOffset - Timezone difference from UTC in minutes
 * @property {string} [gpgsig] - PGP signature (if present)
 */

/**
 * Read a commit object directly
 *
 * @param {object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {FileSystem} [args.fs] - [deprecated] The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.oid - The SHA-1 object id to get. Annotated tags are peeled.
 *
 * @returns {Promise<ReadCommitResult>} Resolves successfully with a git commit object
 * @see ReadCommitResult
 * @see CommitObject
 *
 * @example
 * // Read a commit object
 * let sha = await git.resolveRef({ dir: '$input((/))', ref: '$input((master))' })
 * console.log(sha)
 * let commit = await git.readCommit({ dir: '$input((/))', oid: sha })
 * console.log(commit)
 *
 */
export async function readCommit ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  oid
}) {
  try {
    const fs = new FileSystem(_fs)
    const { commit, oid: commitOid } = await resolveCommit({
      fs,
      gitdir,
      oid
    })
    const result = {
      oid: commitOid,
      commit: commit.parse(),
      payload: commit.withoutSignature()
    }
    // @ts-ignore
    return result
  } catch (err) {
    err.caller = 'git.readCommit'
    throw err
  }
}
