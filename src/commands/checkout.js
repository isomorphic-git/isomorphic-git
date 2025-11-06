// @ts-check
import '../typedefs.js'

import { STAGE } from '../commands/STAGE.js'
import { TREE } from '../commands/TREE.js'
import { WORKDIR } from '../commands/WORKDIR.js'
import { _walk } from '../commands/walk.js'
import { CheckoutConflictError } from '../errors/CheckoutConflictError.js'
import { CommitNotFetchedError } from '../errors/CommitNotFetchedError.js'
import { InternalError } from '../errors/InternalError.js'
import { NotFoundError } from '../errors/NotFoundError.js'
import { GitConfigManager } from '../managers/GitConfigManager.js'
import { GitIndexManager } from '../managers/GitIndexManager.js'
import { GitRefManager } from '../managers/GitRefManager.js'
import { _readObject as readObject } from '../storage/readObject.js'
import { flat } from '../utils/flat.js'
import { worthWalking } from '../utils/worthWalking.js'

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {any} args.cache
 * @param {ProgressCallback} [args.onProgress]
 * @param {PostCheckoutCallback} [args.onPostCheckout]
 * @param {string} args.dir
 * @param {string} args.gitdir
 * @param {string} args.ref
 * @param {string[]} [args.filepaths]
 * @param {string} args.remote
 * @param {boolean} args.noCheckout
 * @param {boolean} [args.noUpdateHead]
 * @param {boolean} [args.dryRun]
 * @param {boolean} [args.force]
 * @param {boolean} [args.track]
 * @param {boolean} [args.nonBlocking]
 * @param {number} [args.batchSize]
 *
 * @returns {Promise<void>} Resolves successfully when filesystem operations are complete
 *
 */
export async function _checkout({
  fs,
  cache,
  onProgress,
  onPostCheckout,
  dir,
  gitdir,
  remote,
  ref,
  filepaths,
  noCheckout,
  noUpdateHead,
  dryRun,
  force,
  track = true,
  nonBlocking = false,
  batchSize = 100,
}) {
  // oldOid is defined only if onPostCheckout hook is attached
  let oldOid
  if (onPostCheckout) {
    try {
      oldOid = await GitRefManager.resolve({ fs, gitdir, ref: 'HEAD' })
    } catch (err) {
      oldOid = '0000000000000000000000000000000000000000'
    }
  }

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
      ref: remoteRef,
    })
    if (track) {
      // Set up remote tracking branch
      const config = await GitConfigManager.get({ fs, gitdir })
      await config.set(`branch.${ref}.remote`, remote)
      await config.set(`branch.${ref}.merge`, `refs/heads/${ref}`)
      await GitConfigManager.save({ fs, gitdir, config })
    }
    // Create a new branch that points at that same commit
    await GitRefManager.writeRef({
      fs,
      gitdir,
      ref: `refs/heads/${ref}`,
      value: oid,
    })
  }

  // Update working dir
  if (!noCheckout) {
    let ops
    // First pass - just analyze files (not directories) and figure out what needs to be done
    try {
      ops = await analyze({
        fs,
        cache,
        onProgress,
        dir,
        gitdir,
        ref,
        force,
        filepaths,
      })
    } catch (err) {
      // Throw a more helpful error message for this common mistake.
      if (err instanceof NotFoundError && err.data.what === oid) {
        throw new CommitNotFetchedError(ref, oid)
      } else {
        throw err
      }
    }

    // Report conflicts
    const conflicts = ops
      .filter(([method]) => method === 'conflict')
      .map(([method, fullpath]) => fullpath)
    if (conflicts.length > 0) {
      throw new CheckoutConflictError(conflicts)
    }

    // Collect errors
    const errors = ops
      .filter(([method]) => method === 'error')
      .map(([method, fullpath]) => fullpath)
    if (errors.length > 0) {
      throw new InternalError(errors.join(', '))
    }

    if (dryRun) {
      // Since the format of 'ops' is in flux, I really would rather folk besides myself not start relying on it
      // return ops

      if (onPostCheckout) {
        await onPostCheckout({
          previousHead: oldOid,
          newHead: oid,
          type: filepaths != null && filepaths.length > 0 ? 'file' : 'branch',
        })
      }
      return
    }

    // Second pass - execute planned changes
    // The cheapest semi-parallel solution without computing a full dependency graph will be
    // to just do ops in 4 dumb phases: delete files, delete dirs, create dirs, write files

    let count = 0
    const total = ops.length
    await GitIndexManager.acquire({ fs, gitdir, cache }, async function(index) {
      await Promise.all(
        ops
          .filter(
            ([method]) => method === 'delete' || method === 'delete-index'
          )
          .map(async function([method, fullpath]) {
            const filepath = `${dir}/${fullpath}`
            if (method === 'delete') {
              await fs.rm(filepath)
            }
            index.delete({ filepath: fullpath })
            if (onProgress) {
              await onProgress({
                phase: 'Updating workdir',
                loaded: ++count,
                total,
              })
            }
          })
      )
    })

    // Note: this is cannot be done naively in parallel
    await GitIndexManager.acquire({ fs, gitdir, cache }, async function(index) {
      for (const [method, fullpath] of ops) {
        if (method === 'rmdir' || method === 'rmdir-index') {
          const filepath = `${dir}/${fullpath}`
          try {
            if (method === 'rmdir') {
              await fs.rmdir(filepath)
            }
            index.delete({ filepath: fullpath })
            if (onProgress) {
              await onProgress({
                phase: 'Updating workdir',
                loaded: ++count,
                total,
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
        .map(async function([_, fullpath]) {
          const filepath = `${dir}/${fullpath}`
          await fs.mkdir(filepath)
          if (onProgress) {
            await onProgress({
              phase: 'Updating workdir',
              loaded: ++count,
              total,
            })
          }
        })
    )

    if (nonBlocking) {
      // Filter eligible operations first
      const eligibleOps = ops.filter(
        ([method]) =>
          method === 'create' ||
          method === 'create-index' ||
          method === 'update' ||
          method === 'mkdir-index'
      )

      const updateWorkingDirResults = await batchAllSettled(
        'Update Working Dir',
        eligibleOps.map(([method, fullpath, oid, mode, chmod]) => () =>
          updateWorkingDir({ fs, cache, gitdir, dir }, [
            method,
            fullpath,
            oid,
            mode,
            chmod,
          ])
        ),
        onProgress,
        batchSize
      )

      await GitIndexManager.acquire(
        { fs, gitdir, cache, allowUnmerged: true },
        async function(index) {
          await batchAllSettled(
            'Update Index',
            updateWorkingDirResults.map(([fullpath, oid, stats]) => () =>
              updateIndex({ index, fullpath, oid, stats })
            ),
            onProgress,
            batchSize
          )
        }
      )
    } else {
      await GitIndexManager.acquire(
        { fs, gitdir, cache, allowUnmerged: true },
        async function(index) {
          await Promise.all(
            ops
              .filter(
                ([method]) =>
                  method === 'create' ||
                  method === 'create-index' ||
                  method === 'update' ||
                  method === 'mkdir-index'
              )
              .map(async function([method, fullpath, oid, mode, chmod]) {
                const filepath = `${dir}/${fullpath}`
                try {
                  if (method !== 'create-index' && method !== 'mkdir-index') {
                    const { object } = await readObject({
                      fs,
                      cache,
                      gitdir,
                      oid,
                    })
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
                      throw new InternalError(
                        `Invalid mode 0o${mode.toString(
                          8
                        )} detected in blob ${oid}`
                      )
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
                    oid,
                  })
                  if (onProgress) {
                    await onProgress({
                      phase: 'Updating workdir',
                      loaded: ++count,
                      total,
                    })
                  }
                } catch (e) {
                  console.log(e)
                }
              })
          )
        }
      )
    }

    if (onPostCheckout) {
      await onPostCheckout({
        previousHead: oldOid,
        newHead: oid,
        type: filepaths != null && filepaths.length > 0 ? 'file' : 'branch',
      })
    }
  }

  // Update HEAD
  if (!noUpdateHead) {
    const fullRef = await GitRefManager.expand({ fs, gitdir, ref })
    if (fullRef.startsWith('refs/heads')) {
      await GitRefManager.writeSymbolicRef({
        fs,
        gitdir,
        ref: 'HEAD',
        value: fullRef,
      })
    } else {
      // detached head
      await GitRefManager.writeRef({ fs, gitdir, ref: 'HEAD', value: oid })
    }
  }
}

async function analyze({
  fs,
  cache,
  onProgress,
  dir,
  gitdir,
  ref,
  force,
  filepaths,
}) {
  let count = 0
  return _walk({
    fs,
    cache,
    dir,
    gitdir,
    trees: [TREE({ ref }), WORKDIR(), STAGE()],
    map: async function(fullpath, [commit, workdir, stage]) {
      if (fullpath === '.') return
      // match against base paths
      if (filepaths && !filepaths.some(base => worthWalking(fullpath, base))) {
        return null
      }
      // Emit progress event
      if (onProgress) {
        await onProgress({ phase: 'Analyzing workdir', loaded: ++count })
      }

      // This is a kind of silly pattern but it worked so well for me in the past
      // and it makes intuitively demonstrating exhaustiveness so *easy*.
      // This checks for the presence and/or absence of each of the 3 entries,
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
          if (force && filepaths && filepaths.includes(fullpath)) {
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
                await commit.mode(),
              ]
            }
            case 'commit': {
              return [
                'mkdir-index',
                fullpath,
                await commit.oid(),
                await commit.mode(),
              ]
            }
            default: {
              return [
                'error',
                `new entry Unhandled type ${await commit.type()}`,
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
                    (await commit.mode()) !== (await workdir.mode()),
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
                      true,
                    ]
                  } else {
                    return ['conflict', fullpath]
                  }
                } else {
                  return [
                    'create-index',
                    fullpath,
                    await commit.oid(),
                    await commit.mode(),
                  ]
                }
              }
            }
            case 'commit-tree': {
              // TODO: submodule
              // We'll ignore submodule directories for now.
              // Users prefer we not throw an error for lack of submodule support.
              // gitlinks
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
              return ['rmdir-index', fullpath]
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
                `delete entry Unhandled type ${await stage.type()}`,
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
                      (await commit.mode()) !== (await workdir.mode()),
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
                  (await commit.mode()) !== (await stage.mode()),
                ]
              }
              // Has file mode changed?
              if ((await commit.mode()) !== (await stage.mode())) {
                return [
                  'update',
                  fullpath,
                  await commit.oid(),
                  await commit.mode(),
                  true,
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
                  false,
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
              return [
                'mkdir-index',
                fullpath,
                await commit.oid(),
                await commit.mode(),
              ]
            }
            default: {
              return [
                'error',
                `update entry Unhandled type ${await stage.type()}-${await commit.type()}`,
              ]
            }
          }
        }
      }
    },
    // Modify the default flat mapping
    reduce: async function(parent, children) {
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
    },
  })
}

async function updateIndex({ index, fullpath, stats, oid }) {
  try {
    index.insert({
      filepath: fullpath,
      stats,
      oid,
    })
  } catch (e) {
    console.warn(`Error inserting ${fullpath} into index:`, e)
  }
}
async function updateWorkingDir(
  { fs, cache, gitdir, dir },
  [method, fullpath, oid, mode, chmod]
) {
  const filepath = `${dir}/${fullpath}`
  if (method !== 'create-index' && method !== 'mkdir-index') {
    const { object } = await readObject({ fs, cache, gitdir, oid })
    if (chmod) {
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
      throw new InternalError(
        `Invalid mode 0o${mode.toString(8)} detected in blob ${oid}`
      )
    }
  }
  const stats = await fs.lstat(filepath)
  if (mode === 0o100755) {
    stats.mode = 0o755
  }
  if (method === 'mkdir-index') {
    stats.mode = 0o160000
  }
  return [fullpath, oid, stats]
}

async function batchAllSettled(operationName, tasks, onProgress, batchSize) {
  const results = []
  try {
    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize).map(task => task())
      const batchResults = await Promise.allSettled(batch)
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') results.push(result.value)
      })
      if (onProgress) {
        await onProgress({
          phase: 'Updating workdir',
          loaded: i + batch.length,
          total: tasks.length,
        })
      }
    }

    return results
  } catch (error) {
    console.error(`Error during ${operationName}: ${error}`)
  }

  return results
}
