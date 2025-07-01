// @ts-check

import { InvalidFilepathError } from '../errors/InvalidFilepathError.js'
import { NotFoundError } from '../errors/NotFoundError.js'
import { GitIndexManager } from '../managers/GitIndexManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { _writeObject } from '../storage/writeObject.js'
import { assertParameter } from '../utils/assertParameter.js'
import { join } from '../utils/join.js'

/**
 * @typedef {object} FileInfo
 * @property {string} filepath - The path to the file.
 * @property {string} [oid] - OID of the object in the object database to add to the index with the specified filepath.
 */

/**
 * Register file contents in the working tree or object database to the git index (aka staging area).
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} args.dir - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir, '.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string | Array<FileInfo>} args.filepath - File to act upon.
 * @param {string} [args.oid] - OID of the object in the object database to add to the index with the specified filepath.
 * @param {number} [args.mode = 100644] - The file mode to add the file to the index.
 * @param {boolean} [args.add] - Adds the specified file to the index if it does not yet exist in the index.
 * @param {boolean} [args.remove] - Remove the specified file from the index if it does not exist in the workspace anymore.
 * @param {boolean} [args.force] - Remove the specified file from the index, even if it still exists in the workspace.
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<string | string[] | void>} Resolves successfully with the SHA-1 object id of the object written or updated in the index, or nothing if the file was removed.
 *
 * @example
 * await git.updateIndex({
 *   fs,
 *   dir: '/tutorial',
 *   filepath: 'readme.md'
 * })
 *
 * @example
 * // Manually create a blob in the object database.
 * let oid = await git.writeBlob({
 *   fs,
 *   dir: '/tutorial',
 *   blob: new Uint8Array([])
 * })
 *
 * // Write the object in the object database to the index.
 * await git.updateIndex({
 *   fs,
 *   dir: '/tutorial',
 *   add: true,
 *   filepath: [{filepath:'readme.md', oid}]
 * })
 */
export async function updateIndex({
  fs: _fs,
  dir,
  gitdir = join(dir, '.git'),
  cache = {},
  filepath,
  oid,
  mode,
  add,
  remove,
  force,
}) {
  try {
    assertParameter('fs', _fs)
    assertParameter('gitdir', gitdir)
    assertParameter('filepath', filepath)

    const pathIsArray = Array.isArray(filepath)
    const filepaths = pathIsArray ? filepath : [{ filepath, oid }]

    const fs = new FileSystem(_fs)

    if (remove) {
      return await GitIndexManager.acquire(
        { fs, gitdir, cache },
        async function(index) {
          let pathsToRemove = []
          if (!force) {
            // Check if the file is still present in the working directory
            await Promise.all(
              filepaths.map(async filepath => {
                const stats = await fs.lstat(join(dir, filepath.filepath))
                // Do nothing if we don't force and the file still exists in the workdir
                if (stats) {
                  if (stats.isDirectory()) {
                    // Removing directories should not work
                    throw new InvalidFilepathError('directory')
                  }
                } else {
                  pathsToRemove.push(filepath)
                }
              })
            )
          } else {
            pathsToRemove = filepaths
          }

          for (const { filepath } of pathsToRemove) {
            if (index.has({ filepath })) {
              index.delete({
                filepath,
              })
            }
          }
        }
      )
    }

    // Test if it is a file and exists on disk if `remove` is not provided, only if no oid is provided
    for (const { oid: fileOid, filepath } of filepaths) {
      if (!fileOid) {
        const fileStats = await fs.lstat(join(dir, filepath))

        if (!fileStats) {
          throw new NotFoundError(
            `file at "${filepath}" on disk and "remove" not set`
          )
        }

        if (fileStats.isDirectory()) {
          throw new InvalidFilepathError('directory')
        }
      }
    }

    return await GitIndexManager.acquire(
      { fs, gitdir, cache, allowUnmerged: false },
      async function(index) {
        if (!add) {
          for (const { filepath } of filepaths) {
            if (!index.has({ filepath })) {
              // If the index does not contain the filepath yet and `add` is not set, we should throw
              throw new NotFoundError(
                `file at "${filepath}" in index and "add" not set`
              )
            }
          }
        }

        // By default we use 0 for the stats of the index file
        const defaultStats = {
          ctime: new Date(0),
          mtime: new Date(0),
          dev: 0,
          ino: 0,
          mode,
          uid: 0,
          gid: 0,
          size: 0,
        }

        const oids = []
        for (const { oid: oldOid, filepath } of filepaths) {
          let oid = oldOid
          let stats
          if (!oid) {
            // Write the file to the object database
            stats = await fs.lstat(join(dir, filepath))
            const object = stats.isSymbolicLink()
              ? await fs.readlink(join(dir, filepath))
              : await fs.read(join(dir, filepath))

            oid = await _writeObject({
              fs,
              gitdir,
              type: 'blob',
              format: 'content',
              object,
            })
          }

          if (!stats) {
            stats = defaultStats
          }
          index.insert({
            filepath,
            oid: oid,
            stats,
          })

          oids.push(oid)
        }
        return pathIsArray ? oids : oids[0] || undefined
      }
    )
  } catch (err) {
    err.caller = 'git.updateIndex'
    throw err
  }
}
