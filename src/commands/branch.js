import { clean } from 'clean-git-ref'
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
    throw new Error('branch.js:20 E2 Cannot create branch "undefined"')
  }

  if (ref !== clean(ref)) {
    throw new Error(
      `branch.js:24 E3 Failed to create branch '${ref}' because that name would not be a valid git reference. A valid alternative would be '${clean(
        ref
      )}'.`
    )
  }

  const exist = await fs.exists(`${gitdir}/refs/heads/${ref}`)
  if (exist) {
    throw new Error(
      `branch.js:29 E4 Failed to create branch '${ref}' because branch '${ref}' already exists.`
    )
  }
  // Get tree oid
  let oid
  try {
    oid = await GitRefManager.resolve({ fs, gitdir, ref: 'HEAD' })
  } catch (e) {
    throw new Error(
      `branch.js:36 E5 Failed to create branch '${ref}' because there are no commits in this project.`
    )
  }
  // Create a new branch that points at that same commit
  await fs.write(`${gitdir}/refs/heads/${ref}`, oid + '\n')
}
