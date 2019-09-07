// @ts-check
import { TREE } from '../commands/TREE.js'
import { walkBeta1 } from '../commands/walkBeta1.js'
import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
import { GitTree } from '../models/GitTree.js'
import { writeObject } from '../storage/writeObject.js'

import { join } from './join.js'
import { mergeFile } from './mergeFile.js'
import { cores } from './plugins.js'

/**
 *
 * @typedef {import('../commands/readObject').TreeEntry} TreeEntry
 */

/**
 * Create a merged tree
 *
 * @param {Object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {FileSystem} [args.fs] - [deprecated] The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.ourOid - The SHA-1 object id of our tree
 * @param {string} args.baseOid - The SHA-1 object id of the base tree
 * @param {string} args.theirOid - The SHA-1 object id of their tree
 * @param {string} [args.ourName='ours'] - The name to use in conflicted files for our hunks
 * @param {string} [args.baseName='base'] - The name to use in conflicted files (in diff3 format) for the base hunks
 * @param {string} [args.theirName='theirs'] - The name to use in conflicted files for their hunks
 * @param {boolean} [args.dryRun=false]
 *
 * @returns {Promise<string>} - The SHA-1 object id of the merged tree
 *
 */
export async function mergeTree ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  ourOid,
  baseOid,
  theirOid,
  ourName = 'ours',
  baseName = 'base',
  theirName = 'theirs',
  dryRun = false
}) {
  const fs = new FileSystem(_fs)
  const ourTree = TREE({ core, dir, gitdir, fs, ref: ourOid })
  const baseTree = TREE({ core, dir, gitdir, fs, ref: baseOid })
  const theirTree = TREE({ core, dir, gitdir, fs, ref: theirOid })

  const results = await walkBeta1({
    trees: [ourTree, baseTree, theirTree],
    map: async function ([ours, base, theirs]) {
      await Promise.all([
        ours.populateStat(),
        base.populateStat(),
        theirs.populateStat(),
        ours.populateHash(),
        base.populateHash(),
        theirs.populateHash()
      ])
      // What we did, what they did
      const ourChange = modified(ours, base)
      const theirChange = modified(theirs, base)
      switch (`${ourChange}-${theirChange}`) {
        case 'false-false': {
          return {
            mode: base.mode,
            path: base.basename,
            oid: base.oid,
            type: base.type
          }
        }
        case 'false-true': {
          return theirs.exists
            ? {
              mode: theirs.mode,
              path: theirs.basename,
              oid: theirs.oid,
              type: theirs.type
            }
            : void 0
        }
        case 'true-false': {
          return ours.exists
            ? {
              mode: ours.mode,
              path: ours.basename,
              oid: ours.oid,
              type: ours.type
            }
            : void 0
        }
        case 'true-true': {
          // Modifications
          if (
            ours.type === 'blob' &&
            base.type === 'blob' &&
            theirs.type === 'blob'
          ) {
            return mergeBlobs({
              fs,
              gitdir,
              ours,
              base,
              theirs,
              ourName,
              baseName,
              theirName
            })
          }
          // all other types of conflicts fail
          throw new GitError(E.MergeNotSupportedFail)
        }
      }
    },
    /**
     * @param {TreeEntry} [parent]
     * @param {Array<TreeEntry>} children
     */
    reduce: async (parent, children) => {
      const entries = children.filter(Boolean) // remove undefineds

      // automatically delete directories if they have been emptied
      if (parent && parent.type === 'tree' && entries.length === 0) return

      if (entries.length > 0) {
        const tree = new GitTree(entries)
        const object = tree.toObject()
        const oid = await writeObject({
          fs,
          gitdir,
          type: 'tree',
          object,
          dryRun
        })
        parent.oid = oid
      }
      return parent
    }
  })
  return results.oid
}

/**
 *
 * @param {import('../commands/walkBeta1.js').WalkerEntry} entry
 * @param {import('../commands/walkBeta1.js').WalkerEntry} base
 *
 */
function modified (entry, base) {
  if (entry.exists && !base.exists) return true
  if (!entry.exists && base.exists) return true
  if (entry.type === 'tree' && base.type === 'tree') return false
  if (
    entry.type === base.type &&
    entry.mode === base.mode &&
    entry.oid === base.oid
  ) {
    return false
  }
  return true
}

/**
 *
 * @param {Object} args
 * @param {FileSystem} args.fs
 * @param {string} args.gitdir
 * @param {import('../commands/walkBeta1.js').WalkerEntry} args.ours
 * @param {import('../commands/walkBeta1.js').WalkerEntry} args.base
 * @param {import('../commands/walkBeta1.js').WalkerEntry} args.theirs
 * @param {string} [args.ourName]
 * @param {string} [args.baseName]
 * @param {string} [args.theirName]
 * @param {string} [args.format]
 * @param {number} [args.markerSize]
 * @param {boolean} [args.dryRun = false]
 *
 */
async function mergeBlobs ({
  fs,
  gitdir,
  ours,
  base,
  theirs,
  ourName,
  theirName,
  baseName,
  format,
  markerSize,
  dryRun
}) {
  const type = 'blob'
  // this might change if we figure out rename detection
  const path = base.basename
  // Compute the new mode.
  // Since there are ONLY two valid blob modes ('100755' and '100644') it boils down to this
  const mode = base.mode === ours.mode ? theirs.mode : ours.mode
  // The trivial case: nothing to merge except maybe mode
  if (ours.oid === theirs.oid) return { mode, path, oid: ours.oid, type }
  // if only one side made oid changes, return that side's oid
  if (ours.oid === base.oid) return { mode, path, oid: theirs.oid, type }
  if (theirs.oid === base.oid) return { mode, path, oid: ours.oid, type }
  // if both sides made changes do a merge
  await Promise.all([
    ours.populateContent(),
    base.populateContent(),
    theirs.populateContent()
  ])
  const { mergedText, cleanMerge } = mergeFile({
    ourContent: ours.content.toString('utf8'),
    baseContent: base.content.toString('utf8'),
    theirContent: theirs.content.toString('utf8'),
    ourName,
    theirName,
    baseName,
    format,
    markerSize
  })
  if (!cleanMerge) {
    // all other types of conflicts fail
    throw new GitError(E.MergeNotSupportedFail)
  }
  const oid = await writeObject({
    fs,
    gitdir,
    type: 'blob',
    object: Buffer.from(mergedText, 'utf8'),
    dryRun
  })
  return { mode, path, oid, type }
}
