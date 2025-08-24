// @ts-check
import '../typedefs.js'

import { GitCommit } from '../models/GitCommit.js'
import { _writeObject as writeObject } from '../storage/writeObject.js'

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string} args.gitdir
 * @param {CommitObject} args.commit
 *
 * @returns {Promise<string>}
 * @see CommitObject
 *
 */
export async function _writeCommit({ fs, gitdir, commit }) {
  // Convert object to buffer
  const object = GitCommit.from(commit).toObject()
  const oid = await writeObject({
    fs,
    gitdir,
    type: 'commit',
    object,
    format: 'content',
  })
  return oid
}
