// @ts-check
import '../typedefs.js'

import { _commit } from '../commands/commit.js'
import { _readCommit } from '../commands/readCommit.js'
import { CherryPickMergeCommitError } from '../errors/CherryPickMergeCommitError.js'
import { CherryPickRootCommitError } from '../errors/CherryPickRootCommitError.js'
import { MergeConflictError } from '../errors/MergeConflictError.js'
import { GitIndexManager } from '../managers/GitIndexManager.js'
import { GitRefManager } from '../managers/GitRefManager.js'
import { mergeTree } from '../utils/mergeTree.js'
import { applyTreeChanges } from '../utils/walkerToTreeEntryMap.js'

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {object} args.cache
 * @param {string} args.dir
 * @param {string} args.gitdir
 * @param {string} args.oid - The commit to cherry-pick
 * @param {boolean} args.dryRun
 * @param {boolean} args.noUpdateBranch
 * @param {boolean} args.abortOnConflict
 * @param {Object} [args.committer]
 * @param {string} [args.committer.name]
 * @param {string} [args.committer.email]
 * @param {number} [args.committer.timestamp]
 * @param {number} [args.committer.timezoneOffset]
 * @param {MergeDriverCallback} [args.mergeDriver]
 *
 * @returns {Promise<string>} - The OID of the newly created commit
 */
export async function _cherryPick({
  fs,
  cache,
  dir,
  gitdir,
  oid,
  dryRun = false,
  noUpdateBranch = false,
  abortOnConflict = true,
  committer,
  mergeDriver,
}) {
  // Commit to cherry-pick
  const { commit: cherryCommit, oid: cherryOid } = await _readCommit({
    fs,
    cache,
    gitdir,
    oid,
  })

  // Validate it's not a merge commit (>1 parent)
  if (cherryCommit.parent.length > 1) {
    throw new CherryPickMergeCommitError(cherryOid, cherryCommit.parent.length)
  }

  // Validate it's not an initial commit (0 parents)
  if (cherryCommit.parent.length === 0) {
    throw new CherryPickRootCommitError(cherryOid)
  }

  // Get current HEAD
  const currentOid = await GitRefManager.resolve({
    fs,
    gitdir,
    ref: 'HEAD',
  })

  const { commit: currentCommit } = await _readCommit({
    fs,
    cache,
    gitdir,
    oid: currentOid,
  })

  // Get parent of cherry-picked commit (the "base" for three-way merge)
  const cherryParentOid = cherryCommit.parent[0]
  const { commit: cherryParent } = await _readCommit({
    fs,
    cache,
    gitdir,
    oid: cherryParentOid,
  })

  // Three-way merge
  // - ourOid: current HEAD tree
  // - baseOid: parent of commit being cherry-picked
  // - theirOid: the commit being cherry-picked
  const mergedTreeOid = await GitIndexManager.acquire(
    { fs, gitdir, cache, allowUnmerged: false },
    async index => {
      return mergeTree({
        fs,
        cache,
        dir,
        gitdir,
        index,
        ourOid: currentCommit.tree,
        baseOid: cherryParent.tree,
        theirOid: cherryCommit.tree,
        ourName: 'HEAD',
        baseName: `parent of ${cherryOid.slice(0, 7)}`,
        theirName: cherryOid.slice(0, 7),
        dryRun,
        abortOnConflict,
        mergeDriver,
      })
    }
  )

  if (mergedTreeOid instanceof MergeConflictError) {
    throw mergedTreeOid
  }

  // Create new commit with single parent
  const newOid = await _commit({
    fs,
    cache,
    gitdir,
    message: cherryCommit.message,
    tree: mergedTreeOid,
    parent: [currentOid], // Single parent: current HEAD
    author: cherryCommit.author, // Preserve original author
    committer, // New committer
    dryRun,
    noUpdateBranch,
  })

  // If we actually updated the branch (not a dryRun and branch pointer updated),
  // make the working tree and index match the newly created commit so there are
  // no staged/unstaged changes left after a successful cherry-pick.
  // Skip it when `noUpdateBranch` is true.
  if (dir && !dryRun && !noUpdateBranch) {
    await applyTreeChanges({
      fs,
      dir,
      gitdir,
      stashCommit: newOid,
      parentCommit: currentOid,
      wasStaged: true,
    })
  }

  return newOid
}
