import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'

import { deleteRef } from './deleteRef'

/**
 * Delete a tag ref.
 *
 * @link https://isomorphic-git.github.io/docs/deleteTag.html
 */
export async function deleteTag ({
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
        function: 'deleteTag',
        parameter: 'ref'
      })
    }
    ref = ref.startsWith('refs/tags/') ? ref : `refs/tags/${ref}`
    await deleteRef({ fs, gitdir, ref })
  } catch (err) {
    err.caller = 'git.deleteTag'
    throw err
  }
}
