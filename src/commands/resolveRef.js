import path from 'path'
import { FileSystem } from '../models'
import { GitRefManager } from '../managers'

/**
 * Get the value of a symbolic ref or resolve a ref to its object id.
 * @param {Object} args - Arguments object
 * @param {FSModule} args.fs - The filesystem holding the git repo
 * @param {string} args.dir - The path to the [working tree](index.html#dir-vs-gitdir) directory
 * @param {string} [args.gitdir=path.join(dir, '.git')] - The path to the [git directory](index.html#dir-vs-gitdir)
 * @param {string} args.ref - Which ref to resolve.
 * @param {number} [args.depth=undefined] - How many symbolic references to follow before returning.
 * @returns {Promise<string>} - Resolves successfully with the SHA, or the value of another symbolic ref.
 *
 * @example
 * let repo = {fs, dir: '<@.@>'}
 * let currentCommit = await git.resolveRef({...repo, ref: '<@HEAD@>'})
 * console.log(currentCommit)
 * let currentBranch = await git.resolveRef({...repo, ref: '<@HEAD@>', depth: 1})
 * console.log(currentBranch)
 */
export async function resolveRef ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  ref,
  depth
}) {
  const fs = new FileSystem(_fs)
  return GitRefManager.resolve({
    fs,
    gitdir,
    ref,
    depth
  })
}
