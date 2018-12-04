import cleanGitRef from 'clean-git-ref'

import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'

/**
 * Create a branch
 *
 * @link https://isomorphic-git.github.io/docs/branch.html
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
