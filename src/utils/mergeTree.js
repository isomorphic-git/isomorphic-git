// @ts-check
import { TREE } from '../commands/TREE.js'
import { walkBeta2 } from '../commands/walkBeta2.js'
import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
import { GitTree } from '../models/GitTree.js'
import { writeObject } from '../storage/writeObject.js'

import { basename } from './basename.js'
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
  const ourTree = TREE({ ref: ourOid })
  const baseTree = TREE({ ref: baseOid })
  const theirTree = TREE({ ref: theirOid })

  const results = await walkBeta2({
    core,
    fs,
    dir,
    gitdir,
    trees: [ourTree, baseTree, theirTree],
    map: async function (filepath, [ours, base, theirs]) {
      const path = basename(filepath)
      // What we did, what they did
      const ourChange = await modified(ours, base)
      const theirChange = await modified(theirs, base)
      switch (`${ourChange}-${theirChange}`) {
        case 'false-false': {
          return {
            mode: await base.mode(),
            path,
            oid: await base.oid(),
            type: await base.type()
          }
        }
        case 'false-true': {
          return theirs
            ? {
              mode: await theirs.mode(),
              path,
              oid: await theirs.oid(),
              type: await theirs.type()
            }
            : void 0
        }
        case 'true-false': {
          return ours
            ? {
              mode: await ours.mode(),
              path,
              oid: await ours.oid(),
              type: await ours.type()
            }
            : void 0
        }
        case 'true-true': {
          // Modifications
          if (
            ours && base && theirs &&
            (await ours.type()) === 'blob' &&
            (await base.type()) === 'blob' &&
            (await theirs.type()) === 'blob'
          ) {
            return mergeBlobs({
              fs,
              gitdir,
              path,
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
 * @param {import('../commands/walkBeta2.js').WalkerEntry} entry
 * @param {import('../commands/walkBeta2.js').WalkerEntry} base
 *
 */
async function modified (entry, base) {
  if (!entry && !base) return false
  if (entry && !base) return true
  if (!entry && base) return true
  if ((await entry.type()) === 'tree' && (await base.type()) === 'tree') { return false }
  if (
    (await entry.type()) === (await base.type()) &&
    (await entry.mode()) === (await base.mode()) &&
    (await entry.oid()) === (await base.oid())
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
 * @param {string} args.path
 * @param {import('../commands/walkBeta2.js').WalkerEntry} args.ours
 * @param {import('../commands/walkBeta2.js').WalkerEntry} args.base
 * @param {import('../commands/walkBeta2.js').WalkerEntry} args.theirs
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
  path,
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
  // Compute the new mode.
  // Since there are ONLY two valid blob modes ('100755' and '100644') it boils down to this
  const mode =
    (await base.mode()) === (await ours.mode())
      ? await theirs.mode()
      : await ours.mode()
  // The trivial case: nothing to merge except maybe mode
  if ((await ours.oid()) === (await theirs.oid())) { return { mode, path, oid: await ours.oid(), type } }
  // if only one side made oid changes, return that side's oid
  if ((await ours.oid()) === (await base.oid())) { return { mode, path, oid: await theirs.oid(), type } }
  if ((await theirs.oid()) === (await base.oid())) { return { mode, path, oid: await ours.oid(), type } }
  // if both sides made changes do a merge
  const { mergedText, cleanMerge } = mergeFile({
    ourContent: (await ours.content()).toString('utf8'),
    baseContent: (await base.content()).toString('utf8'),
    theirContent: (await theirs.content()).toString('utf8'),
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
