// @ts-check
import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { assertParameter } from '../utils/assertParameter.js'
import { join } from '../utils/join.js'

/**
 * List refs
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.filepath] - [required] The refs path to list
 *
 * @returns {Promise<Array<string>>} Resolves successfully with an array of ref names below the supplied `filepath`
 *
 * @example
 * let refs = await git.listRefs({ fs, dir: '/tutorial', filepath: 'refs/heads' })
 * console.log(refs)
 *
 */
export async function listRefs({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  filepath,
}) {
  try {
    assertParameter('fs', fs)
    assertParameter('gitdir', gitdir)
    return GitRefManager.listRefs({ fs: new FileSystem(fs), gitdir, filepath })
  } catch (err) {
    err.caller = 'git.listRefs'
    throw err
  }
}
