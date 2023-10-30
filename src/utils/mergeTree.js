// @ts-check
import '../typedefs.js'

import { TREE } from '../commands/TREE.js'
import { _walk } from '../commands/walk.js'
import { MergeConflictError } from '../errors/MergeConflictError.js'
import { MergeNotSupportedError } from '../errors/MergeNotSupportedError.js'
import { GitTree } from '../models/GitTree.js'
import { _writeObject as writeObject } from '../storage/writeObject.js'

import { basename } from './basename.js'
import { join } from './join.js'
import { mergeFile } from './mergeFile.js'
import { modified } from './modified.js'

/**
 * Create a merged tree
 *
 * @param {Object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {object} args.cache
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.ourOid - The SHA-1 object id of our tree
 * @param {string} args.baseOid - The SHA-1 object id of the base tree
 * @param {string} args.theirOid - The SHA-1 object id of their tree
 * @param {string} [args.ourName='ours'] - The name to use in conflicted files for our hunks
 * @param {string} [args.baseName='base'] - The name to use in conflicted files (in diff3 format) for the base hunks
 * @param {string} [args.theirName='theirs'] - The name to use in conflicted files for their hunks
 * @param {boolean} [args.dryRun=false]
 * @param {boolean} [args.abortOnConflict=false]
 * @param {MergeDriverCallback} [args.mergeDriver]
 *
 * @returns {Promise<string>} - The SHA-1 object id of the merged tree
 *
 */
export async function mergeTree({
  fs,
  cache,
  dir,
  gitdir = join(dir, '.git'),
  index,
  ourOid,
  baseOid,
  theirOid,
  ourName = 'ours',
  baseName = 'base',
  theirName = 'theirs',
  dryRun = false,
  abortOnConflict = true,
  mergeDriver,
}) {
  const ourTree = TREE({ ref: ourOid })
  const baseTree = TREE({ ref: baseOid })
  const theirTree = TREE({ ref: theirOid })

  const unmergedFiles = []
  const bothModified = []
  const deleteByUs = []
  const deleteByTheirs = []

  const results = await _walk({
    fs,
    cache,
    dir,
    gitdir,
    trees: [ourTree, baseTree, theirTree],
    map: async function(filepath, [ours, base, theirs]) {
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
            type: await base.type(),
          }
        }
        case 'false-true': {
          return theirs
            ? {
                mode: await theirs.mode(),
                path,
                oid: await theirs.oid(),
                type: await theirs.type(),
              }
            : undefined
        }
        case 'true-false': {
          return ours
            ? {
                mode: await ours.mode(),
                path,
                oid: await ours.oid(),
                type: await ours.type(),
              }
            : undefined
        }
        case 'true-true': {
          // Modifications
          if (
            ours &&
            base &&
            theirs &&
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
              theirName,
              mergeDriver,
            }).then(async r => {
              if (!r.cleanMerge) {
                unmergedFiles.push(filepath)
                bothModified.push(filepath)
                if (!abortOnConflict) {
                  const baseOid = await base.oid()
                  const ourOid = await ours.oid()
                  const theirOid = await theirs.oid()

                  index.delete({ filepath })

                  index.insert({ filepath, oid: baseOid, stage: 1 })
                  index.insert({ filepath, oid: ourOid, stage: 2 })
                  index.insert({ filepath, oid: theirOid, stage: 3 })
                }
              } else if (!abortOnConflict) {
                index.insert({ filepath, oid: r.mergeResult.oid, stage: 0 })
              }
              return r.mergeResult
            })
          }

          // deleted by us
          if (
            base &&
            !ours &&
            theirs &&
            (await base.type()) === 'blob' &&
            (await theirs.type()) === 'blob'
          ) {
            unmergedFiles.push(filepath)
            deleteByUs.push(filepath)
            if (!abortOnConflict) {
              const baseOid = await base.oid()
              const theirOid = await theirs.oid()

              index.delete({ filepath })

              index.insert({ filepath, oid: baseOid, stage: 1 })
              index.insert({ filepath, oid: theirOid, stage: 3 })
            }

            return {
              mode: await theirs.mode(),
              oid: await theirs.oid(),
              type: 'blob',
              path,
            }
          }

          // deleted by theirs
          if (
            base &&
            ours &&
            !theirs &&
            (await base.type()) === 'blob' &&
            (await ours.type()) === 'blob'
          ) {
            unmergedFiles.push(filepath)
            deleteByTheirs.push(filepath)
            if (!abortOnConflict) {
              const baseOid = await base.oid()
              const ourOid = await ours.oid()

              index.delete({ filepath })

              index.insert({ filepath, oid: baseOid, stage: 1 })
              index.insert({ filepath, oid: ourOid, stage: 2 })
            }

            return {
              mode: await ours.mode(),
              oid: await ours.oid(),
              type: 'blob',
              path,
            }
          }

          // deleted by both
          if (base && !ours && !theirs && (await base.type()) === 'blob') {
            return undefined
          }

          // all other types of conflicts fail
          // TODO: Merge conflicts involving additions
          throw new MergeNotSupportedError()
        }
      }
    },
    /**
     * @param {TreeEntry} [parent]
     * @param {Array<TreeEntry>} children
     */
    reduce:
      unmergedFiles.length !== 0 && (!dir || abortOnConflict)
        ? undefined
        : async (parent, children) => {
            const entries = children.filter(Boolean) // remove undefineds

            // if the parent was deleted, the children have to go
            if (!parent) return

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
                dryRun,
              })
              parent.oid = oid
            }
            return parent
          },
  })

  if (unmergedFiles.length !== 0) {
    if (dir && !abortOnConflict) {
      await _walk({
        fs,
        cache,
        dir,
        gitdir,
        trees: [TREE({ ref: results.oid })],
        map: async function(filepath, [entry]) {
          const path = `${dir}/${filepath}`
          if ((await entry.type()) === 'blob') {
            const mode = await entry.mode()
            const content = new TextDecoder().decode(await entry.content())
            await fs.write(path, content, { mode })
          }
          return true
        },
      })
    }
    return new MergeConflictError(
      unmergedFiles,
      bothModified,
      deleteByUs,
      deleteByTheirs
    )
  }

  return results.oid
}

/**
 *
 * @param {Object} args
 * @param {import('../models/FileSystem').FileSystem} args.fs
 * @param {string} args.gitdir
 * @param {string} args.path
 * @param {WalkerEntry} args.ours
 * @param {WalkerEntry} args.base
 * @param {WalkerEntry} args.theirs
 * @param {string} [args.ourName]
 * @param {string} [args.baseName]
 * @param {string} [args.theirName]
 * @param {boolean} [args.dryRun = false]
 * @param {MergeDriverCallback} [args.mergeDriver]
 *
 */
async function mergeBlobs({
  fs,
  gitdir,
  path,
  ours,
  base,
  theirs,
  ourName,
  theirName,
  baseName,
  dryRun,
  mergeDriver = mergeFile,
}) {
  const type = 'blob'
  // Compute the new mode.
  // Since there are ONLY two valid blob modes ('100755' and '100644') it boils down to this
  const mode =
    (await base.mode()) === (await ours.mode())
      ? await theirs.mode()
      : await ours.mode()
  // The trivial case: nothing to merge except maybe mode
  if ((await ours.oid()) === (await theirs.oid())) {
    return {
      cleanMerge: true,
      mergeResult: { mode, path, oid: await ours.oid(), type },
    }
  }
  // if only one side made oid changes, return that side's oid
  if ((await ours.oid()) === (await base.oid())) {
    return {
      cleanMerge: true,
      mergeResult: { mode, path, oid: await theirs.oid(), type },
    }
  }
  if ((await theirs.oid()) === (await base.oid())) {
    return {
      cleanMerge: true,
      mergeResult: { mode, path, oid: await ours.oid(), type },
    }
  }
  // if both sides made changes do a merge
  const ourContent = Buffer.from(await ours.content()).toString('utf8')
  const baseContent = Buffer.from(await base.content()).toString('utf8')
  const theirContent = Buffer.from(await theirs.content()).toString('utf8')
  const { mergedText, cleanMerge } = await mergeDriver({
    branches: [baseName, ourName, theirName],
    contents: [baseContent, ourContent, theirContent],
    path,
  })
  const oid = await writeObject({
    fs,
    gitdir,
    type: 'blob',
    object: Buffer.from(mergedText, 'utf8'),
    dryRun,
  })

  return { cleanMerge, mergeResult: { mode, path, oid, type } }
}
