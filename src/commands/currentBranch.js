import path from 'path'

import { GitRefManager } from '../managers'
import { FileSystem } from '../models'

// @see https://git-scm.com/docs/git-rev-parse.html#_specifying_revisions
const regexs = [
  new RegExp('refs/remotes/(.*)/HEAD'),
  new RegExp('refs/remotes/(.*)'),
  new RegExp('refs/heads/(.*)'),
  new RegExp('refs/tags/(.*)'),
  new RegExp('refs/(.*)')
]

function abbreviate (ref) {
  for (const reg of regexs) {
    let matches = reg.exec(ref)
    if (matches) {
      return matches[1]
    }
  }
  return ref
}

/**
 * Get the name of the branch currently pointed to by .git/HEAD
 *
 * @link https://isomorphic-git.github.io/docs/currentBranch.html
 */
export async function currentBranch ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  fullname = false
}) {
  try {
    const fs = new FileSystem(_fs)
    let ref = await GitRefManager.resolve({
      fs,
      gitdir,
      ref: 'HEAD',
      depth: 2
    })
    if (fullname) return ref
    return abbreviate(ref)
  } catch (err) {
    err.caller = 'git.currentBranch'
    throw err
  }
}
