//@ts-check
import cleanGitRef from 'clean-git-ref'

import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'

/**
 * Create a branch
 *
 * @param {object} _
 * @param {string} [_.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {string} [_.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [_.gitdir] - The [git directory](dir-vs-gitdir.md) path
 * @param {FileSystem} [_.fs] - [deprecated] The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).
 * @param {string} _.ref - What to name the branch
 * @param {boolean} [_.checkout = false] - Update `HEAD` to point at the newly created branch
 * 
 * @returns {Promise<void>} Resolves successfully when filesystem operations are complete
 * 
 * @example
 * await git.branch({ dir: '$input((/))', ref: '$input((develop))' })
 * console.log('done')
 * 
 */
export async function branch ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  ref,
  checkout = false
}) {
  try {
    const fs = new FileSystem(_fs)
    if (ref === undefined) {
      throw new GitError(E.MissingRequiredParameterError, {
        function: 'branch',
        parameter: 'ref'
      })
    }

    if (ref !== cleanGitRef.clean(ref)) {
      throw new GitError(E.InvalidRefNameError, {
        verb: 'create',
        noun: 'branch',
        ref,
        suggestion: cleanGitRef.clean(ref)
      })
    }

    const exist = await fs.exists(`${gitdir}/refs/heads/${ref}`)
    if (exist) {
      throw new GitError(E.RefExistsError, { noun: 'branch', ref })
    }
    // Get tree oid
    let oid
    try {
      oid = await GitRefManager.resolve({ fs, gitdir, ref: 'HEAD' })
    } catch (e) {
      throw new GitError(E.NoHeadCommitError, { noun: 'branch', ref })
    }
    // Create a new branch that points at that same commit
    await fs.write(`${gitdir}/refs/heads/${ref}`, oid + '\n')
    if (checkout) {
      // Update HEAD
      await fs.write(`${gitdir}/HEAD`, `ref: refs/heads/${ref}`)
    }
  } catch (err) {
    err.caller = 'git.branch'
    throw err
  }
}
