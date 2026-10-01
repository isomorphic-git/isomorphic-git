// @ts-check
import '../typedefs.js'

import { STAGE } from '../commands/STAGE.js'
import { TREE } from '../commands/TREE.js'
import { WORKDIR } from '../commands/WORKDIR.js'
import { _commit } from '../commands/commit.js'
import { _readCommit } from '../commands/readCommit.js'
import { _walk } from '../commands/walk.js'
import { CherryPickLocalChangesError } from '../errors/CherryPickLocalChangesError.js'
import { CherryPickMergeCommitError } from '../errors/CherryPickMergeCommitError.js'
import { CherryPickRootCommitError } from '../errors/CherryPickRootCommitError.js'
import { MergeConflictError } from '../errors/MergeConflictError.js'
import { GitIndexManager } from '../managers/GitIndexManager.js'
import { GitRefManager } from '../managers/GitRefManager.js'
import { mergeTree } from '../utils/mergeTree.js'
import { applyTreeChanges } from '../utils/walkerToTreeEntryMap.js'
import { worthWalking } from '../utils/worthWalking.js'

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
  // would overwrite local changes to the files the picked commit touches.
  // Writing out conflicts rewrites every tracked file, so in that mode any local
  // change to a tracked file is in the way.
  if (dir && ((!dryRun && !noUpdateBranch) || !abortOnConflict)) {
    const filepaths = await findLocalChanges({
      fs,
      cache,
      dir,
      gitdir,
      headTree: currentCommit.tree,
      baseTree: cherryParent.tree,
      theirTree: cherryCommit.tree,
      allTracked: !abortOnConflict,
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

/**
 * Lists the files changed between `baseTree` and `theirTree` whose index or
 * working tree copy differs from `headTree`, including untracked files that
 * would be replaced. With `allTracked`, every file tracked in `headTree` is
 * checked as well.
 *
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {object} args.cache
 * @param {string} args.dir
 * @param {string} args.gitdir
 * @param {string} args.headTree
 * @param {string} args.baseTree
 * @param {string} args.theirTree
 * @param {boolean} args.allTracked
 *
 * @returns {Promise<string[]>}
 */
async function findLocalChanges({
  fs,
  cache,
  dir,
  gitdir,
  headTree,
  baseTree,
  theirTree,
  allTracked,
}) {
  /** @type {string[]} */
  const changed = await _walk({
    fs,
    cache,
    dir,
    gitdir,
    trees: [TREE({ ref: baseTree }), TREE({ ref: theirTree })],
    map: async (filepath, [base, their]) => {
      if (filepath === '.') return
      if (base && their && (await base.oid()) === (await their.oid())) {
        return null
      }
      const types = [
        base ? await base.type() : undefined,
        their ? await their.type() : undefined,
      ]
      if (types.includes('blob')) return filepath
    },
  })
  if (changed.length === 0 && !allTracked) return []

  return _walk({
    fs,
    cache,
    dir,
    gitdir,
    trees: [TREE({ ref: headTree }), STAGE(), WORKDIR()],
    map: async (filepath, [head, stage, workdir]) => {
      if (filepath === '.') return
      if (!allTracked && !changed.some(path => worthWalking(filepath, path))) {
        return null
      }
      const headOid =
        head && (await head.type()) === 'blob' ? await head.oid() : undefined
      if (!changed.includes(filepath) && !(allTracked && headOid)) return

      const stageOid = stage ? await stage.oid() : undefined
      // Staged changes would be replaced by the cherry-picked version.
      if (stageOid !== headOid) return filepath
      // A file missing from the working tree has nothing to lose.
      if (!workdir) return
      // Untracked files, directories in the way, and unstaged edits.
      if (
        !headOid ||
        (await workdir.type()) !== 'blob' ||
        (await workdir.oid()) !== headOid
      ) {
        return filepath
      }
    },
  })
}
