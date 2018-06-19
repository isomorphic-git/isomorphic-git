import { clean } from 'clean-git-ref'
import path from 'path'

import { GitRefManager } from '../managers'
import { E, FileSystem, GitError } from '../models'

/**
 * Create a branch
 *
 * @link https://isomorphic-git.github.io/docs/branch.html
 */
export async function branch ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  ref
}) {
  try {
    const fs = new FileSystem(_fs)
    if (ref === undefined) {
      throw new GitError(E.MissingRequiredParameterError, {
        function: 'branch',
        parameter: 'ref'
      })
    }

    if (ref !== clean(ref)) {
      throw new GitError(E.InvalidRefNameError, {
        verb: 'create',
        noun: 'branch',
        ref,
        suggestion: clean(ref)
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
  } catch (err) {
    err.caller = 'git.branch'
    throw err
  }
}
