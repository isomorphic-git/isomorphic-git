// @ts-check
import 'typedefs'

import { resolveCommit } from '../utils/resolveCommit.js'

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string} args.gitdir
 * @param {string} args.oid
 *
 * @returns {Promise<ReadCommitResult>} Resolves successfully with a git commit object
 * @see ReadCommitResult
 * @see CommitObject
 *
 */
export async function _readCommit({ fs, gitdir, oid }) {
  const { commit, oid: commitOid } = await resolveCommit({
    fs,
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
