// @ts-check
import '../commands/typedefs.js'

import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join.js'
import { readCommit as _readCommit } from '../commands/readCommit.js'
import { assertParameter } from '../utils/assertParameter.js'

/**
 * Read a commit object directly
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
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
  fs,
  dir,
  gitdir = join(dir, '.git'),
  oid
}) {
  try {
    assertParameter('fs', fs)
    assertParameter('gitdir', gitdir)
    assertParameter('oid', oid)

    return await _readCommit({
      fs: new FileSystem(fs),
      gitdir,
      oid
    })
  } catch (err) {
    err.caller = 'git.readCommit'
    throw err
  }
}
