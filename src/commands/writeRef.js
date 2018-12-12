import cleanGitRef from 'clean-git-ref'

import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'

/**
 * Write a ref.
 *
 * @link https://isomorphic-git.github.io/docs/writeRef.html
 */
export async function writeRef ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  ref,
  value,
  force = false,
  symbolic = false
}) {
  try {
    const fs = new FileSystem(_fs)

    if (ref !== cleanGitRef.clean(ref)) {
      throw new GitError(E.InvalidRefNameError, {
        verb: 'write',
        noun: 'ref',
        ref,
        suggestion: cleanGitRef.clean(ref)
      })
    }

    if (!force && (await GitRefManager.exists({ fs, gitdir, ref }))) {
      throw new GitError(E.RefExistsError, { noun: 'ref', ref })
    }

    if (symbolic) {
      await GitRefManager.writeSymbolicRef({
        fs,
        gitdir,
        ref,
        value
      })
    } else {
      value = await GitRefManager.resolve({
        fs,
        gitdir,
        ref: value
      })
      await GitRefManager.writeRef({
        fs,
        gitdir,
        ref,
        value
      })
    }
  } catch (err) {
    err.caller = 'git.writeRef'
    throw err
  }
}
