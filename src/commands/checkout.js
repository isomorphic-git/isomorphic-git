// @ts-check
import { GitIndexManager } from '../managers/GitIndexManager.js'
import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
import { readObject } from '../storage/readObject.js'
import { flat } from '../utils/flat.js'
import { join } from '../utils/join.js'
import { worthWalking } from '../utils/worthWalking.js'

import { STAGE } from './STAGE.js'
import { TREE } from './TREE.js'
import { WORKDIR } from './WORKDIR.js'
import { config } from './config.js'
import { walk } from './walk.js'

/**
 * Checkout a branch
 *
 * If the branch already exists it will check out that branch. Otherwise, it will create a new remote tracking branch set to track the remote branch of that name.
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {ProgressCallback} [args.onProgress] - optional progress event callback
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {string} args.dir - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.ref = 'HEAD'] - Source to checkout files from
 * @param {string[]} [args.filepaths = ['.']] - Limit the checkout to the given files and directories
 * @param {string} [args.remote = 'origin'] - Which remote repository to use
 * @param {boolean} [args.noCheckout = false] - If true, will update HEAD but won't update the working directory
 * @param {boolean} [args.noUpdateHead] - If true, will update the working directory but won't update HEAD. Defaults to `false` when `ref` is provided, and `true` if `ref` is not provided.
 * @param {boolean} [args.dryRun = false] - If true, simulates a checkout so you can test whether it would succeed.
 * @param {boolean} [args.force = false] - If true, conflicts will be ignored and files will be overwritten regardless of local changes.
 * @param {boolean} [args.noSubmodules = false] - If true, will not print out errors about missing submodules support.
 * @param {boolean} [args.newSubmoduleBehavior = false] - If true, will opt into a newer behavior that improves submodule non-support by at least not accidentally deleting them.
 *
 * @returns {Promise<void>} Resolves successfully when filesystem operations are complete
 *
 * @example
 * // switch to the master branch
 * await git.checkout({ dir: '$input((/))', ref: '$input((master))' })
 * console.log('done')
 *
 * @example
 * // restore the 'docs' and 'src/docs' folders to the way they were, overwriting any changes
 * await git.checkout({ dir: '$input((/))', force: true, filepaths: ['docs', 'src/docs'] })
 * console.log('done')
 *
 * @example
 * // restore the 'docs' and 'src/docs' folders to the way they are in the 'develop' branch, overwriting any changes
 * await git.checkout({ dir: '$input((/))', ref: 'develop', noUpdateHead: true, force: true, filepaths: ['docs', 'src/docs'] })
 * console.log('done')
 */
export async function checkout ({
  fs: _fs,
  onProgress,
  dir,
  gitdir = join(dir, '.git'),
  remote = 'origin',
  ref: _ref,
  filepaths = ['.'],
  noCheckout = false,
  noUpdateHead = _ref === void 0,
  dryRun = false,
  // @ts-ignore
  debug = false,
  force = false,
  noSubmodules = false,
  newSubmoduleBehavior = false
}) {
  try {
    const ref = _ref || 'HEAD'
    const fs = new FileSystem(_fs)
    // Get tree oid
    let oid
    try {
      oid = await GitRefManager.resolve({ fs, gitdir, ref })
      // TODO: Figure out what to do if both 'ref' and 'remote' are specified, ref already exists,
      // and is configured to track a different remote.
    } catch (err) {
      if (ref === 'HEAD') throw err
      // If `ref` doesn't exist, create a new remote tracking branch
      // Figure out the commit to checkout
      const remoteRef = `${remote}/${ref}`
      oid = await GitRefManager.resolve({
        fs,
        gitdir,
        ref: remoteRef
      })
      // Set up remote tracking branch
      await config({
        fs: _fs,
        gitdir,
        path: `branch.${ref}.remote`,
        value: `${remote}`
      })
      await config({
        fs: _fs,
        gitdir,
        path: `branch.${ref}.merge`,
        value: `refs/heads/${ref}`
      })
      // Create a new branch that points at that same commit
      await fs.write(`${gitdir}/refs/heads/${ref}`, oid + '\n')
    }

    // Update working dir
    if (!noCheckout) {
      let ops
      // First pass - just analyze files (not directories) and figure out what needs to be done
      try {
        ops = await analyze({
          fs,
          onProgress,
          dir,
          gitdir,
          ref,
          force,
          filepaths,
          noSubmodules,
          newSubmoduleBehavior
        })
      } catch (err) {
        // Throw a more helpful error message for this common mistake.
        if (err.code === E.ReadObjectFail && err.data.oid === oid) {
          throw new GitError(E.CommitNotFetchedError, { ref, oid })
        } else {
          throw err
        }
      }

      // Report conflicts
      const conflicts = ops
        .filter(([method]) => method === 'conflict')
        .map(([method, fullpath]) => fullpath)
      if (conflicts.length > 0) {
        throw new GitError(E.CheckoutConflictError, { filepaths: conflicts })
      }

      // Collect errors
      const errors = ops
        .filter(([method]) => method === 'error')
        .map(([method, fullpath]) => fullpath)
      if (errors.length > 0) {
        throw new GitError(E.InternalFail, { message: errors })
      }

      if (dryRun) {
        // Since the format of 'ops' is in flux, I really would rather folk besides myself not start relying on it
        if (debug) {
          return ops
        } else {
          return
        }
      }

      // Second pass - execute planned changes
      // The cheapest semi-parallel solution without computing a full dependency graph will be
      // to just do ops in 4 dumb phases: delete files, delete dirs, create dirs, write files

      let count = 0
      const total = ops.length
      await GitIndexManager.acquire({ fs, gitdir }, async function (index) {
        await Promise.all(
          ops
            .filter(
              ([method]) => method === 'delete' || method === 'delete-index'
            )
            .map(async function ([method, fullpath]) {
              const filepath = `${dir}/${fullpath}`
              if (method === 'delete') {
                await fs.rm(filepath)
              }
              index.delete({ filepath: fullpath })
              if (onProgress) {
                onProgress({
                  phase: 'Updating workdir',
                  loaded: ++count,
                  total
                })
              }
            })
        )
      })

      // Note: this is cannot be done naively in parallel
      await GitIndexManager.acquire({ fs, gitdir }, async function (index) {
        for (const [method, fullpath] of ops) {
          if (method === 'rmdir' || method === 'rmdir-index') {
            const filepath = `${dir}/${fullpath}`
            try {
              if (method === 'rmdir-index') {
                index.delete({ filepath: fullpath })
              }
              await fs.rmdir(filepath)
              if (onProgress) {
                onProgress({
                  phase: 'Updating workdir',
                  loaded: ++count,
                  total
                })
              }
            } catch (e) {
              if (e.code === 'ENOTEMPTY') {
                console.log(
                  `Did not delete ${fullpath} because directory is not empty`
                )
              } else {
                throw e
              }
            }
          }
        }
      })

      await Promise.all(
        ops
          .filter(([method]) => method === 'mkdir' || method === 'mkdir-index')
          .map(async function ([_, fullpath]) {
            const filepath = `${dir}/${fullpath}`
            await fs.mkdir(filepath)
            if (onProgress) {
              onProgress({
                phase: 'Updating workdir',
                loaded: ++count,
                total
              })
            }
          })
      )

      await GitIndexManager.acquire({ fs, gitdir }, async function (index) {
        await Promise.all(
          ops
            .filter(
              ([method]) =>
                method === 'create' ||
                method === 'create-index' ||
                method === 'update' ||
                method === 'mkdir-index'
            )
            .map(async function ([method, fullpath, oid, mode, chmod]) {
              const filepath = `${dir}/${fullpath}`
              try {
                if (method !== 'create-index' && method !== 'mkdir-index') {
                  const { object } = await readObject({ fs, gitdir, oid })
                  if (chmod) {
                    // Note: the mode option of fs.write only works when creating files,
                    // not updating them. Since the `fs` plugin doesn't expose `chmod` this
                    // is our only option.
                    await fs.rm(filepath)
                  }
                  if (mode === 0o100644) {
                    // regular file
                    await fs.write(filepath, object)
                  } else if (mode === 0o100755) {
                    // executable file
                    await fs.write(filepath, object, { mode: 0o777 })
                  } else if (mode === 0o120000) {
                    // symlink
                    await fs.writelink(filepath, object)
                  } else {
                    throw new GitError(E.InternalFail, {
                      message: `Invalid mode 0o${mode.toString(
                        8
                      )} detected in blob ${oid}`
                    })
                  }
                }

                const stats = await fs.lstat(filepath)
                // We can't trust the executable bit returned by lstat on Windows,
                // so we need to preserve this value from the TREE.
                // TODO: Figure out how git handles this internally.
                if (mode === 0o100755) {
                  stats.mode = 0o755
                }
                // Submodules are present in the git index but use a unique mode different from trees
                if (method === 'mkdir-index') {
                  stats.mode = 0o160000
                }
                index.insert({
                  filepath: fullpath,
                  stats,
                  oid
                })
                if (onProgress) {
                  onProgress({
                    phase: 'Updating workdir',
                    loaded: ++count,
                    total
                  })
                }
              } catch (e) {
                console.log(e)
              }
            })
        )
      })
    }

    // Update HEAD
    if (!noUpdateHead) {
      const fullRef = await GitRefManager.expand({ fs, gitdir, ref })
      if (fullRef.startsWith('refs/heads')) {
        await GitRefManager.writeSymbolicRef({
          fs,
          gitdir,
          ref: 'HEAD',
          value: fullRef
        })
      } else {
        // detached head
        await GitRefManager.writeRef({ fs, gitdir, ref: 'HEAD', value: oid })
      }
    }
  } catch (err) {
    err.caller = 'git.checkout'
    throw err
  }
}

async function analyze ({
  fs,
  onProgress,
  dir,
  gitdir,
  ref,
  force,
  filepaths,
  noSubmodules,
  newSubmoduleBehavior
}) {
  let count = 0
  return walk({
    fs,
    dir,
    gitdir,
    trees: [TREE({ ref }), WORKDIR(), STAGE()],
    map: async function (fullpath, [commit, workdir, stage]) {
      if (fullpath === '.') return
      // match against base paths
      if (!filepaths.some(base => worthWalking(fullpath, base))) {
        return null
      }
      // Emit progress event
      if (onProgress) onProgress({ phase: 'Analyzing workdir', loaded: ++count })

      // This is a kind of silly pattern but it worked so well for me in calculateBasicAuthUsernamePasswordPair.js
      // and it makes intuitively demonstrating exhaustiveness so *easy*.
      // This checks for the presense and/or absense of each of the 3 entries,
      // converts that to a 3-bit binary representation, and then handles
      // every possible combination (2^3 or 8 cases) with a lookup table.
      const key = [!!stage, !!commit, !!workdir].map(Number).join('')
      switch (key) {
        // Impossible case.
        case '000':
          return
        // Ignore workdir files that are not tracked and not part of the new commit.
        case '001':
          // OK, make an exception for explicitly named files.
          if (force && filepaths.includes(fullpath)) {
            return ['delete', fullpath]
          }
          return
        // New entries
        case '010': {
          switch (await commit.type()) {
            case 'tree': {
              return ['mkdir', fullpath]
            }
            case 'blob': {
              return [
                'create',
                fullpath,
                await commit.oid(),
                await commit.mode()
              ]
            }
            case 'commit': {
              // gitlinks
              if (!noSubmodules) {
                console.log(
                  new GitError(E.NotImplementedFail, {
                    thing: 'submodule support'
                  })
                )
              }
              if (newSubmoduleBehavior) {
                return [
                  'mkdir-index',
                  fullpath,
                  await commit.oid(),
                  await commit.mode()
                ]
              } else {
                return
              }
            }
            default: {
              return [
                'error',
                `new entry Unhandled type ${await commit.type()}`
              ]
            }
          }
        }
        // New entries but there is already something in the workdir there.
        case '011': {
          switch (`${await commit.type()}-${await workdir.type()}`) {
            case 'tree-tree': {
              return // noop
            }
            case 'tree-blob':
            case 'blob-tree': {
              return ['conflict', fullpath]
            }
            case 'blob-blob': {
              // Is the incoming file different?
              if ((await commit.oid()) !== (await workdir.oid())) {
                if (force) {
                  return [
                    'update',
                    fullpath,
                    await commit.oid(),
                    await commit.mode(),
                    (await commit.mode()) !== (await workdir.mode())
                  ]
                } else {
                  return ['conflict', fullpath]
                }
              } else {
                // Is the incoming file a different mode?
                if ((await commit.mode()) !== (await workdir.mode())) {
                  if (force) {
                    return [
                      'update',
                      fullpath,
                      await commit.oid(),
                      await commit.mode(),
                      true
                    ]
                  } else {
                    return ['conflict', fullpath]
                  }
                } else {
                  return [
                    'create-index',
                    fullpath,
                    await commit.oid(),
                    await commit.mode()
                  ]
                }
              }
            }
            case 'commit-tree': {
              // TODO: submodule
              // We'll ignore submodule directories for now.
              // Users prefer we not throw an error for lack of submodule support.
              // gitlinks
              console.log(
                new GitError(E.NotImplementedFail, {
                  thing: 'submodule support'
                })
              )
              return
            }
            case 'commit-blob': {
              // TODO: submodule
              // But... we'll complain if there is a *file* where we would
              // put a submodule if we had submodule support.
              return ['conflict', fullpath]
            }
            default: {
              return ['error', `new entry Unhandled type ${commit.type}`]
            }
          }
        }
        // Something in stage but not in the commit OR the workdir.
        // Note: I verified this behavior against canonical git.
        case '100': {
          return ['delete-index', fullpath]
        }
        // Deleted entries
        // TODO: How to handle if stage type and workdir type mismatch?
        case '101': {
          switch (await stage.type()) {
            case 'tree': {
              return ['rmdir', fullpath]
            }
            case 'blob': {
              // Git checks that the workdir.oid === stage.oid before deleting file
              if ((await stage.oid()) !== (await workdir.oid())) {
                if (force) {
                  return ['delete', fullpath]
                } else {
                  return ['conflict', fullpath]
                }
              } else {
                return ['delete', fullpath]
              }
            }
            case 'commit': {
              return ['rmdir-index', fullpath]
            }
            default: {
              return [
                'error',
                `delete entry Unhandled type ${await stage.type()}`
              ]
            }
          }
        }
        /* eslint-disable no-fallthrough */
        // File missing from workdir
        case '110':
        // Possibly modified entries
        case '111': {
          /* eslint-enable no-fallthrough */
          switch (`${await stage.type()}-${await commit.type()}`) {
            case 'tree-tree': {
              return
            }
            case 'blob-blob': {
              // If the file hasn't changed, there is no need to do anything.
              // Existing file modifications in the workdir can be be left as is.
              if (
                (await stage.oid()) === (await commit.oid()) &&
                (await stage.mode()) === (await commit.mode()) &&
                !force
              ) {
                return
              }

              // Check for local changes that would be lost
              if (workdir) {
                // Note: canonical git only compares with the stage. But we're smart enough
                // to compare to the stage AND the incoming commit.
                if (
                  (await workdir.oid()) !== (await stage.oid()) &&
                  (await workdir.oid()) !== (await commit.oid())
                ) {
                  if (force) {
                    return [
                      'update',
                      fullpath,
                      await commit.oid(),
                      await commit.mode(),
                      (await commit.mode()) !== (await workdir.mode())
                    ]
                  } else {
                    return ['conflict', fullpath]
                  }
                }
              } else if (force) {
                return [
                  'update',
                  fullpath,
                  await commit.oid(),
                  await commit.mode(),
                  (await commit.mode()) !== (await stage.mode())
                ]
              }
              // Has file mode changed?
              if ((await commit.mode()) !== (await stage.mode())) {
                return [
                  'update',
                  fullpath,
                  await commit.oid(),
                  await commit.mode(),
                  true
                ]
              }
              // TODO: HANDLE SYMLINKS
              // Has the file content changed?
              if ((await commit.oid()) !== (await stage.oid())) {
                return [
                  'update',
                  fullpath,
                  await commit.oid(),
                  await commit.mode(),
                  false
                ]
              } else {
                return
              }
            }
            case 'tree-blob': {
              return ['update-dir-to-blob', fullpath, await commit.oid()]
            }
            case 'blob-tree': {
              return ['update-blob-to-tree', fullpath]
            }
            case 'commit-commit': {
              if (newSubmoduleBehavior) {
                return [
                  'mkdir-index',
                  fullpath,
                  await commit.oid(),
                  await commit.mode()
                ]
              } else {
                return [
                  'error',
                  `update entry Unhandled type ${await stage.type()}-${await commit.type()}`
                ]
              }
            }
            default: {
              return [
                'error',
                `update entry Unhandled type ${await stage.type()}-${await commit.type()}`
              ]
            }
          }
        }
      }
    },
    // Modify the default flat mapping
    reduce: async function (parent, children) {
      children = flat(children)
      if (!parent) {
        return children
      } else if (parent && parent[0] === 'rmdir') {
        children.push(parent)
        return children
      } else {
        children.unshift(parent)
        return children
      }
    }
  })
}
