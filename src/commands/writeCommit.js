// @ts-check
import '../commands/typedefs.js'

import { FileSystem } from '../models/FileSystem.js'
import { GitCommit } from '../models/GitCommit.js'
import { writeObject } from '../storage/writeObject.js'
import { join } from '../utils/join.js'

/**
 * Write a commit object directly
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {CommitObject} args.commit - The object to write
 *
 * @returns {Promise<string>} Resolves successfully with the SHA-1 object id of the newly written object
 * @see CommitObject
 *
 */
export async function writeCommit ({
  fs: _fs,
  dir,
  gitdir = join(dir, '.git'),
  commit
}) {
  try {
    const fs = new FileSystem(_fs)
    // Convert object to buffer
    const object = GitCommit.from(commit).toObject()
    const oid = await writeObject({
      fs,
      gitdir,
      type: 'commit',
      object,
      format: 'content'
    })
    return oid
  } catch (err) {
    err.caller = 'git.writeCommit'
    throw err
  }
}
