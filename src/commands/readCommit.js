// @ts-check
import '../commands/typedefs.js'
import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'
import { resolveCommit } from '../utils/resolveCommit.js'

/**
 * Read a commit object directly
 *
 * @param {object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
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
  oid
}) {
  try {
    const fs = new FileSystem(cores.get(core).get('fs'))
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
