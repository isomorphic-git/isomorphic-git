// @ts-check
import '../typedefs.js'

import { resolveCommit } from '../utils/resolveCommit.js'

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {any} args.cache
 * @param {string} args.gitdir
 * @param {string} args.oid
 *
 * @returns {Promise<ReadCommitResult>} Resolves successfully with a git commit object
 * @see ReadCommitResult
 * @see CommitObject
 *
 */
export async function _readCommit({ fs, cache, gitdir, oid }) {
  const { commit, oid: commitOid } = await resolveCommit({
    fs,
    cache,
    gitdir,
    oid,
  })
  const result = {
    oid: commitOid,
    commit: commit.parse(),
    payload: commit.withoutSignature(),
  }
  // @ts-ignore
  return result
}
