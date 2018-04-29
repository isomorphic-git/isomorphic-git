import path from 'path'

import { GitRefManager } from '../managers'
import { FileSystem } from '../models'

/**
 * List tags
 *
 * @link https://isomorphic-git.github.io/docs/listTags.html
 */
export async function listTags ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs
}) {
  const fs = new FileSystem(_fs)
  return GitRefManager.listTags({ fs, gitdir })
}
