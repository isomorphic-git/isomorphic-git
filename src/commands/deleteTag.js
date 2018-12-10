import { deleteRef } from './deleteRef'
import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'

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
    const ref = ref.startsWith('refs/tags/') ? ref : `refs/tags/${ref}`
    await deleteRef({ fs, gitdir, ref })
  } catch (err) {
    err.caller = 'git.deleteTag'
    throw err
  }
}
