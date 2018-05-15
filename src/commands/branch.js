import path from 'path'

import { GitRefManager } from '../managers'
import { FileSystem } from '../models'

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
  const fs = new FileSystem(_fs)
  if (ref === undefined) {
    throw new Error('Cannot create branch "undefined"')
  }

  const exist = await fs.exists(`${gitdir}/refs/heads/${ref}`)
  if (exist) {
    throw new Error(`Failed to create branch '${ref}' because branch '${ref}' already exists.`)
  }
  // Get tree oid
  let oid
  try {
    oid = await GitRefManager.resolve({ fs, gitdir, ref: 'HEAD' })
  } catch (e) {
    throw new Error(`Failed to create branch '${ref}' because there are no commits in this project.`)
  }
  // Create a new branch that points at that same commit
  await fs.write(`${gitdir}/refs/heads/${ref}`, oid + '\n')
}
