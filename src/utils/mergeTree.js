// @ts-check
import '../typedefs.js'

import { TREE } from '../commands/TREE.js'
import { _walk } from '../commands/walk.js'
import { MergeConflictError } from '../errors/MergeConflictError.js'
import { MergeLocalChangesError } from '../errors/MergeLocalChangesError.js'
import { MergeNotSupportedError } from '../errors/MergeNotSupportedError.js'
import { GitIgnoreManager } from '../managers/GitIgnoreManager.js'
import { GitTree } from '../models/GitTree.js'
import { _writeObject as writeObject } from '../storage/writeObject.js'

import { assertNoSymlinkInLeadingPath } from './assertNoSymlinkInLeadingPath.js'
import { basename } from './basename.js'
import { dirname } from './dirname.js'
import { isBinary } from './isBinary.js'
import { join } from './join.js'
import { mergeFile } from './mergeFile.js'
import { modified } from './modified.js'

const EMPTY_TREE_OID = '4b825dc642cb6eb9a060e54bf8d69288fbee4904'

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
  // Every path in the three trees: a name made up for a version that has to
  // move aside must be none of them, as in git.
  const seen = new Set()

  // Record the sides of a conflicted path in the index, like git does.
  const updateIndex = !abortOnConflict && !dryRun
  // An empty index means the working tree was never checked out: the whole
  // result is written then, not just what the merge changed.
  const checkedOut = index.entriesMap.size > 0
  // Changes to the index wait until nothing is found in the way of the
  // result, so that a refused merge leaves the index as it was.
  const staging = []
  const staged = {
    insert: entry => staging.push(() => index.insert(entry)),
    delete: entry => staging.push(() => index.delete(entry)),
  }
  // The names made up in reduce for versions that move aside.
  const asides = []
  const stageEntry = async (filepath, entry, stage) =>
    staged.insert({
      filepath,
      oid: await entry.oid(),
      mode: await entry.mode(),
      stage,
    })
  // What reduce needs to record `entry` as `filepath~<label>`.
  const moveAside = async (filepath, label, entry, stages) => ({
    dir: dirname(filepath),
    name: `${basename(filepath)}~${label.replace(/\//g, '_')}`,
    entry: {
      mode: await entry.mode(),
      oid: await entry.oid(),
      type: 'blob',
    },
    stages,
  })

  const results = await _walk({
    fs,
    cache,
    dir,
    gitdir,
    trees: [ourTree, baseTree, theirTree],
    map: async function (filepath, [ours, base, theirs]) {
      seen.add(filepath)
      const path = basename(filepath)
      // A directory one side replaced with a file: what is in the directory
      // is merged as if the file side had deleted it, and reduce decides
      // where the file goes.
      const types = await Promise.all(
        [ours, base, theirs].map(entry => entry && entry.type())
      )
      if (
        types[1] === 'tree' &&
        types[0] &&
        types[2] &&
        (types[0] === 'tree') !== (types[2] === 'tree')
      ) {
        const [directory, file, side] =
          types[0] === 'tree'
            ? [ours, theirs, 'theirs']
            : [theirs, ours, 'ours']
        // A submodule in place of a directory is not supported.
        if ((await file.type()) !== 'blob') throw new MergeNotSupportedError()
        return {
          mode: await directory.mode(),
          path,
          oid: await directory.oid(),
          type: 'tree',
          file: {
            mode: await file.mode(),
            path,
            oid: await file.oid(),
            type: 'blob',
          },
          aside: () =>
            moveAside(filepath, side === 'ours' ? ourName : theirName, file, [
              [file, side === 'ours' ? 2 : 3],
            ]),
        }
      }
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
          // if directory is deleted in theirs but not in ours we return our directory
          if (!theirs && (await ours.type()) === 'tree') {
            return {
              mode: await ours.mode(),
              path,
              oid: await ours.oid(),
              type: await ours.type(),
            }
          }

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
          // if directory is deleted in ours but not in theirs we return their directory
          if (!ours && (await theirs.type()) === 'tree') {
            return {
              mode: await theirs.mode(),
              path,
              oid: await theirs.oid(),
              type: await theirs.type(),
            }
          }

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
          // Handle tree-tree merges (directories)
          if (
            ours &&
            theirs &&
            (await ours.type()) === 'tree' &&
            (await theirs.type()) === 'tree'
          ) {
            return {
              mode: await ours.mode(),
              path,
              oid: await ours.oid(),
              type: 'tree',
            }
          }

          // Modifications - both are blobs
          if (
            ours &&
            theirs &&
            (await ours.type()) === 'blob' &&
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
              if (r.renamed) {
                // A symlink and a regular file: the file goes to
                // `path~<side>` (see reduce), and each name gets the
                // stages of its own version, and of the base if it has the
                // same type.
                unmergedFiles.push(filepath)
                bothModified.push(filepath)
                const isLink = async entry => (await entry.mode()) === 0o120000
                const sides = { ours: [ours, 2], theirs: [theirs, 3] }
                const [file, fileStage] = sides[r.renamed]
                const [link, linkStage] =
                  sides[r.renamed === 'ours' ? 'theirs' : 'ours']
                const linkStages = [[link, linkStage]]
                const fileStages = [[file, fileStage]]
                if (base && (await base.type()) === 'blob') {
                  if (await isLink(base)) linkStages.unshift([base, 1])
                  else fileStages.unshift([base, 1])
                }
                if (updateIndex) {
                  staged.delete({ filepath })
                  for (const [entry, stage] of linkStages) {
                    await stageEntry(filepath, entry, stage)
                  }
                }
                return {
                  ...r.mergeResult,
                  aside: await moveAside(
                    filepath,
                    r.renamed === 'ours' ? ourName : theirName,
                    file,
                    fileStages
                  ),
                }
              }
              if (!r.cleanMerge) {
                unmergedFiles.push(filepath)
                bothModified.push(filepath)
                if (updateIndex) {
                  staged.delete({ filepath })
                  if (base && (await base.type()) === 'blob') {
                    await stageEntry(filepath, base, 1)
                  }
                  await stageEntry(filepath, ours, 2)
                  await stageEntry(filepath, theirs, 3)
                }
              } else if (
                updateIndex &&
                // A result equal to ours is in the index already, with the
                // file's stats, and is not written again.
                !(
                  dir &&
                  checkedOut &&
                  r.mergeResult.oid === (await ours.oid()) &&
                  r.mergeResult.mode === (await ours.mode())
                )
              ) {
                staged.insert({
                  filepath,
                  oid: r.mergeResult.oid,
                  mode: r.mergeResult.mode,
                  stage: 0,
                })
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
            if (updateIndex) {
              staged.delete({ filepath })
              await stageEntry(filepath, base, 1)
              await stageEntry(filepath, theirs, 3)
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
            if (updateIndex) {
              staged.delete({ filepath })
              await stageEntry(filepath, base, 1)
              await stageEntry(filepath, ours, 2)
            }

            return {
              mode: await ours.mode(),
              oid: await ours.oid(),
              type: 'blob',
              path,
            }
          }

          // deleted by both
          if (
            base &&
            !ours &&
            !theirs &&
            ((await base.type()) === 'blob' || (await base.type()) === 'tree')
          ) {
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

            if (parent.file) {
              // A directory one side replaced with a file. Like git, the
              // file takes its place if nothing is left in it, and moves
              // aside otherwise.
              if (entries.length === 0) return parent.file
              parent.aside = await parent.aside()
            }
            // Like git, a version that cannot stay at its path is recorded
            // as `path~<side>`, with a suffix when that name is taken in the
            // result or in any of the three trees.
            for (const { aside } of entries.filter(entry => entry.aside)) {
              const taken = new Set(entries.map(entry => entry.path))
              const free = name =>
                !taken.has(name) && !seen.has(join(aside.dir, name))
              let name = aside.name
              for (let i = 0; !free(name); i++) name = `${aside.name}_${i}`
              entries.push({ ...aside.entry, path: name })
              const filepath = join(aside.dir, name)
              unmergedFiles.push(filepath)
              asides.push(filepath)
              if (updateIndex) {
                for (const [entry, stage] of aside.stages) {
                  await stageEntry(filepath, entry, stage)
                }
              }
            }

            // automatically delete directories if they have been emptied
            // except for the root directory
            if (
              parent &&
              parent.type === 'tree' &&
              entries.length === 0 &&
              parent.path !== '.'
            )
              return

            if (
              entries.length > 0 ||
              (parent.path === '.' && entries.length === 0)
            ) {
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

  if (unmergedFiles.length !== 0 && dir && updateIndex) {
    // Like git, refuse to put a version that moves aside over an untracked
    // file or directory, unless it is a file that .gitignore ignores.
    const inTheWay = []
    for (const filepath of asides) {
      const stats = await fs.lstat(`${dir}/${filepath}`)
      if (
        stats &&
        (stats.isDirectory() ||
          !(await GitIgnoreManager.isIgnored({
            fs,
            dir,
            gitdir,
            filepath,
            strict: true,
          })))
      ) {
        inTheWay.push(filepath)
      }
    }
    if (inTheWay.length > 0) throw new MergeLocalChangesError(inTheWay)
  }
  for (const change of staging) change()

  if (unmergedFiles.length !== 0) {
    if (dir && updateIndex) {
      await applyMergedTree({
        fs,
        cache,
        dir,
        gitdir,
        index,
        treeOid: results.oid,
        ourOid: checkedOut ? ourOid : EMPTY_TREE_OID,
        unmerged: new Set(unmergedFiles),
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
  let baseMode = '100755'
  let baseOid = ''
  let baseContent = new Uint8Array()
  if (base && (await base.type()) === 'blob') {
    baseMode = await base.mode()
    baseOid = await base.oid()
    baseContent = await base.content()
  }
  const ourMode = await ours.mode()
  const theirMode = await theirs.mode()
  // Like git, a symlink on one side and a regular file on the other are not
  // merged: the symlink stays and the file is recorded under another name.
  if ((ourMode === 0o120000) !== (theirMode === 0o120000)) {
    const [kept, renamed] =
      ourMode === 0o120000 ? [ours, 'theirs'] : [theirs, 'ours']
    return {
      cleanMerge: false,
      renamed,
      mergeResult: {
        mode: await kept.mode(),
        path,
        oid: await kept.oid(),
        type,
      },
    }
  }
  const mode = baseMode === ourMode ? theirMode : ourMode
  // Like git, two modes and no base to choose between them are a conflict.
  const modeConflict = !baseOid && ourMode !== theirMode
  // The trivial case: nothing to merge except maybe mode
  if ((await ours.oid()) === (await theirs.oid())) {
    return {
      cleanMerge: !modeConflict,
      mergeResult: { mode, path, oid: await ours.oid(), type },
    }
  }
  // if only one side made oid changes, return that side's oid
  if ((await ours.oid()) === baseOid) {
    return {
      cleanMerge: true,
      mergeResult: { mode, path, oid: await theirs.oid(), type },
    }
  }
  if ((await theirs.oid()) === baseOid) {
    return {
      cleanMerge: true,
      mergeResult: { mode, path, oid: await ours.oid(), type },
    }
  }
  // Like git, never merge symlink targets: ours stays and all three versions
  // are recorded in the index.
  if ((await ours.mode()) === 0o120000 || (await theirs.mode()) === 0o120000) {
    return {
      cleanMerge: false,
      mergeResult: {
        mode: await ours.mode(),
        path,
        oid: await ours.oid(),
        type,
      },
    }
  }
  // if both sides made changes do a merge
  const ourContent = await ours.content()
  const theirContent = await theirs.content()
  const builtIn = mergeDriver === mergeFile
  // Like git, the built-in driver never merges binary files: ours stays in
  // the working tree and every version (base, ours, theirs) is recorded in the index.
  // Custom drivers are still called for them, as in git.
  if (builtIn && [baseContent, ourContent, theirContent].some(isBinary)) {
    return {
      cleanMerge: false,
      mergeResult: { mode, path, oid: await ours.oid(), type },
    }
  }
  // The built-in driver merges bytes like git, so text in any encoding comes
  // out unchanged. Custom drivers are given UTF-8 text, as documented.
  const encoding = builtIn ? 'latin1' : 'utf8'
  const label = s =>
    encoding === 'latin1' ? Buffer.from(s, 'utf8').toString('latin1') : s
  const { mergedText, cleanMerge } = await mergeDriver({
    branches: [label(baseName), label(ourName), label(theirName)],
    contents: [baseContent, ourContent, theirContent].map(c =>
      Buffer.from(c).toString(encoding)
    ),
    path,
  })
  const oid = await writeObject({
    fs,
    gitdir,
    type: 'blob',
    object: Buffer.from(mergedText, encoding),
    dryRun,
  })

  return {
    cleanMerge: cleanMerge && !modeConflict,
    mergeResult: { mode, path, oid, type },
  }
}

/**
 * Bring the working tree and the index from `ourOid` to `treeOid`. Only paths
 * whose blob or mode differ are written or removed, so local edits in files
 * the merge did not touch survive, like with git. Paths in `unmerged` keep the
 * stage entries the merge recorded.
 *
 * @param {Object} args
 * @param {import('../models/FileSystem').FileSystem} args.fs
 * @param {object} args.cache
 * @param {string} args.dir
 * @param {string} args.gitdir
 * @param {import('../models/GitIndex.js').GitIndex} args.index
 * @param {string} args.treeOid
 * @param {string} args.ourOid
 * @param {Set<string>} args.unmerged
 */
export async function applyMergedTree({
  fs,
  cache,
  dir,
  gitdir,
  index,
  treeOid,
  ourOid,
  unmerged,
}) {
  const removed = []
  await _walk({
    fs,
    cache,
    dir,
    gitdir,
    trees: [TREE({ ref: treeOid }), TREE({ ref: ourOid })],
    map: async (filepath, [merged, ours]) => {
      if (filepath === '.') return
      const mergedType = merged && (await merged.type())
      const ourType = ours && (await ours.type())
      // Nothing to do inside a directory the merge did not change.
      if (
        mergedType === 'tree' &&
        ourType === 'tree' &&
        (await merged.oid()) === (await ours.oid())
      ) {
        return null
      }
      if (!(await modified(merged, ours))) return
      const fullpath = `${dir}/${filepath}`
      const replacesDirectory = ourType === 'tree'
      if (replacesDirectory) {
        // A directory the merge removed is emptied file by file (untracked
        // files in it survive) and dropped below. One replaced by a file has
        // to go now, index entries included, and the walk must not descend
        // into what is no longer there.
        if (!merged) return
        await fs.rmdir(fullpath, { recursive: true })
        index.delete({ filepath })
      } else if (ourType === 'commit') {
        // Submodules are not checked out. Like git, a submodule the merge
        // removes or replaces leaves the index, and its directory goes only
        // when it is empty: the files in it are not ours.
        if (mergedType !== 'commit') {
          try {
            await fs.rmdir(fullpath)
          } catch (err) {
            // Not empty.
          }
          index.delete({ filepath })
          removed.push(filepath)
        }
      } else if (ours) {
        // Only a creating write can set the mode, and a symlink cannot be
        // rewritten in place, so a new mode, type or link target needs a
        // fresh file.
        if (
          mergedType !== 'blob' ||
          (await merged.mode()) !== (await ours.mode()) ||
          (await merged.mode()) === 0o120000
        ) {
          await fs.rm(fullpath)
        }
        if (mergedType !== 'blob') {
          index.delete({ filepath })
          removed.push(filepath)
        }
      } else {
        // Nothing of ours is here, but an untracked file that .gitignore
        // ignores may be, since findLocalChanges lets those through. Like
        // git, replace it, or remove it to make room for a directory.
        const stats = await fs.lstat(fullpath)
        if (stats && !stats.isDirectory()) await fs.rm(fullpath)
      }
      if (mergedType === 'commit') {
        // Like git, stage the commit a submodule points at and give a new
        // one an empty directory.
        await assertNoSymlinkInLeadingPath(fs, dir, filepath)
        await fs.mkdir(fullpath)
        index.insert({ filepath, oid: await merged.oid(), mode: 0o160000 })
        return null
      }
      if (mergedType !== 'blob') return
      await assertNoSymlinkInLeadingPath(fs, dir, filepath)
      const mode = await merged.mode()
      const oid = await merged.oid()
      const content = await merged.content()
      if (mode === 0o120000) {
        // Unlike write, writelink does not create the parent directory.
        await fs.mkdir(dirname(fullpath))
        await fs.writelink(fullpath, Buffer.from(content))
      } else {
        await fs.write(
          fullpath,
          content,
          mode === 0o100755 ? { mode: 0o777 } : {}
        )
      }
      const done = replacesDirectory ? null : undefined
      if (unmerged.has(filepath)) return done
      const stats = await fs.lstat(fullpath)
      // The executable bit from lstat cannot be trusted on Windows.
      if (mode === 0o100755) stats.mode = 0o755
      index.insert({ filepath, stats, oid })
      return done
    },
  })
  // Like git, drop the directories the removals emptied.
  for (const filepath of removed) {
    for (let d = dirname(filepath); d !== '.'; d = dirname(d)) {
      try {
        await fs.rmdir(`${dir}/${d}`)
      } catch (err) {
        break
      }
    }
  }
}
