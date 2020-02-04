// @ts-check
import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join.js'

/**
 * Get the value of a symbolic ref or resolve a ref to its SHA-1 object id
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir, '.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.ref - The ref to resolve
 * @param {number} [args.depth = undefined] - How many symbolic references to follow before returning
 *
 * @returns {Promise<string>} Resolves successfully with a SHA-1 object id or the value of a symbolic ref
 *
 * @example
 * let currentCommit = await git.resolveRef({ dir: '$input((/))', ref: '$input((HEAD))' })
 * console.log(currentCommit)
 * let currentBranch = await git.resolveRef({ dir: '$input((/))', ref: '$input((HEAD))', depth: $input((2)) })
 * console.log(currentBranch)
 *
 */
export async function resolveRef ({
  fs: _fs,
  dir,
  gitdir = join(dir, '.git'),
  ref,
  depth
}) {
  try {
    const fs = new FileSystem(_fs)
    const oid = await GitRefManager.resolve({
      fs,
      gitdir,
      ref,
      depth
    })
    return oid
  } catch (err) {
    err.caller = 'git.resolveRef'
    throw err
  }
}
