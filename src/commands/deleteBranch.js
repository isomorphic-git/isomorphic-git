// @ts-check
import cleanGitRef from 'clean-git-ref'

import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'

import { currentBranch } from './currentBranch'

/**
 * Delete a local branch
 *
 * > Note: This only deletes loose branches - it should be fixed in the future to delete packed branches as well.
 *
 * @param {Object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {FileSystem} [args.fs] - [deprecated] The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.ref - The branch to delete
 *
 * @returns {Promise<void>} Resolves successfully when filesystem operations are complete
 *
 * @example
 * await git.deleteBranch({ dir: '$input((/))', ref: '$input((local-branch))' })
 * console.log('done')
 *
 */
export async function deleteBranch ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  ref
}) {
  try {
    const fs = new FileSystem(_fs)
    if (ref === undefined) {
      throw new GitError(E.MissingRequiredParameterError, {
        function: 'deleteBranch',
        parameter: 'ref'
      })
    }

    if (ref !== cleanGitRef.clean(ref)) {
      throw new GitError(E.InvalidRefNameError, {
        verb: 'delete',
        noun: 'branch',
        ref,
        suggestion: cleanGitRef.clean(ref)
      })
    }

    const exist = await fs.exists(`${gitdir}/refs/heads/${ref}`)
    if (!exist) {
      throw new GitError(E.RefNotExistsError, {
        verb: 'delete',
        noun: 'branch',
        ref
      })
    }

    const currentRef = await currentBranch({ fs, gitdir })
    if (ref === currentRef) {
      throw new GitError(E.BranchDeleteError, { ref })
    }

    // Delete a specified branch
    await fs.rm(`${gitdir}/refs/heads/${ref}`)
  } catch (err) {
    err.caller = 'git.deleteBranch'
    throw err
  }
}
