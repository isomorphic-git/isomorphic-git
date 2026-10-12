// @ts-check
import '../typedefs.js'

import { _commit } from '../commands/commit.js'
import { _readCommit } from '../commands/readCommit.js'
import { CherryPickLocalChangesError } from '../errors/CherryPickLocalChangesError.js'
import { CherryPickMergeCommitError } from '../errors/CherryPickMergeCommitError.js'
import { CherryPickRootCommitError } from '../errors/CherryPickRootCommitError.js'
import { MergeConflictError } from '../errors/MergeConflictError.js'
import { MergeLocalChangesError } from '../errors/MergeLocalChangesError.js'
import { GitIndexManager } from '../managers/GitIndexManager.js'
import { GitRefManager } from '../managers/GitRefManager.js'
import { findLocalChanges } from '../utils/findLocalChanges.js'
import { applyMergedTree, mergeTree } from '../utils/mergeTree.js'

const EMPTY_TREE_OID = '4b825dc642cb6eb9a060e54bf8d69288fbee4904'

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

  // The working tree is rewritten after a successful cherry-pick, and also when
  // conflicts are written out. Like `git cherry-pick`, refuse to start if that
  // would overwrite local changes.
  if (dir && !dryRun && (!noUpdateBranch || !abortOnConflict)) {
    const filepaths = await findLocalChanges({
      fs,
      cache,
      dir,
      gitdir,
      headTree: currentCommit.tree,
      baseTree: cherryParent.tree,
      theirTree: cherryCommit.tree,
    })
    if (filepaths.length > 0) {
      throw new CherryPickLocalChangesError(filepaths)
    }
  }

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
        theirName: `${cherryOid.slice(0, 7)} (${
          cherryCommit.message.split('\n')[0]
        })`,
        dryRun,
        abortOnConflict,
        mergeDriver,
      }).catch(err => {
        // A version that moves aside would go over an untracked file.
        if (err instanceof MergeLocalChangesError) {
          throw new CherryPickLocalChangesError(err.data.filepaths)
        }
        throw err
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
  // no staged/unstaged changes left after a successful cherry-pick. The same
  // code as a conflicted merge does it, so files are written, deleted and
  // staged the way git does. A working tree that was never checked out
  // (empty index) gets the whole commit. Skip it when `noUpdateBranch` is
  // true.
  if (dir && !dryRun && !noUpdateBranch) {
    await GitIndexManager.acquire({ fs, gitdir, cache }, index =>
      applyMergedTree({
        fs,
        cache,
        dir,
        gitdir,
        index,
        treeOid: mergedTreeOid,
        ourOid: index.entriesMap.size > 0 ? currentCommit.tree : EMPTY_TREE_OID,
        unmerged: new Set(),
      })
    )
  }

  return newOid
}
