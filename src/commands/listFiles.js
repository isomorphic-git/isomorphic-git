// @ts-check
import { readTree } from '../commands/readTree'
import { GitIndexManager } from '../managers/GitIndexManager.js'
import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join'

/**
 * List all the files in the git index or a commit
 *
 * > Note: This function is efficient for listing the files in the staging area, but listing all the files in a commit requires recursively walking through the git object store.
 * > If you do not require a complete list of every file, better can be achieved by using [readObject](./readObject.html) directly and ignoring subdirectories you don't care about.
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.ref] - Return a list of all the files in the commit at `ref` instead of the files currently in the git index (aka staging area)
 *
 * @returns {Promise<Array<string>>} Resolves successfully with an array of filepaths
 *
 * @example
 * // All the files in the previous commit
 * let files = await git.listFiles({ dir: '$input((/))', ref: '$input((HEAD))' })
 * console.log(files)
 * // All the files in the current staging area
 * files = await git.listFiles({ dir: '$input((/))' })
 * console.log(files)
 *
 */
export async function listFiles ({
  fs: _fs,
  dir,
  gitdir = join(dir, '.git'),
  ref
}) {
  try {
    const fs = new FileSystem(_fs)
    if (ref) {
      const oid = await GitRefManager.resolve({ gitdir, fs, ref })
      const filenames = []
      await accumulateFilesFromOid({ fs, gitdir, oid, filenames, prefix: '' })
      return filenames
    } else {
      return GitIndexManager.acquire({ fs, gitdir }, async function (index) {
        return index.entries.map(x => x.path)
      })
    }
  } catch (err) {
    err.caller = 'git.listFiles'
    throw err
  }
}

async function accumulateFilesFromOid ({ fs, gitdir, oid, filenames, prefix }) {
  const { tree } = await readTree({ fs, gitdir, oid })
  // Note: this isn't parallelized because I'm too lazy to figure that out right now
  // @ts-ignore
  for (const entry of tree) {
    if (entry.type === 'tree') {
      await accumulateFilesFromOid({
        fs,
        gitdir,
        oid: entry.oid,
        filenames,
        prefix: join(prefix, entry.path)
      })
    } else {
      filenames.push(join(prefix, entry.path))
    }
  }
}
