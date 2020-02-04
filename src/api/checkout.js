// @ts-check
import '../commands/typedefs.js'
import { checkout as _checkout } from '../commands/checkout.js'
import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join.js'
import { assertParameter } from '../utils/assertParameter.js'

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
 * @param {string[]} [args.filepaths] - Limit the checkout to the given files and directories
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
  fs,
  onProgress,
  dir,
  gitdir = join(dir, '.git'),
  remote = 'origin',
  ref: _ref,
  filepaths,
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
    assertParameter('fs', fs)
    assertParameter('dir', dir)
    assertParameter('gitdir', gitdir)

    const ref = _ref || 'HEAD'
    return await _checkout({
      fs: new FileSystem(fs),
      onProgress,
      dir,
      gitdir,
      remote,
      ref,
      filepaths,
      noCheckout,
      noUpdateHead,
      dryRun,
      debug,
      force,
      noSubmodules,
      newSubmoduleBehavior
    })
  } catch (err) {
    err.caller = 'git.checkout'
    throw err
  }
}
