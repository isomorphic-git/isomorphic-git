import path from 'path'
import { FileSystem } from '../models'

/**
 * List all local branches
 *
 * @param {Object} args - Arguments object
 * @param {FSModule} args.fs - The filesystem holding the git repo
 * @param {string} args.dir - The path to the [working tree](index.html#dir-vs-gitdir) directory
 * @param {string} [args.gitdir=path.join(dir, '.git')] - The path to the [git directory](index.html#dir-vs-gitdir)
 * @returns {Promise<string[]>} - Resolves successfully with an array of branch names.
 *
 * @example
 * let repo = {fs, dir: '.'}
 * let branches = await git.listBranches(repo)
 * console.log(branches)
 */
export async function listBranches ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs
}) {
  const fs = new FileSystem(_fs)
  let files = await fs.readdirDeep(`${gitdir}/refs/heads`)
  files = files.map(x => x.replace(`${gitdir}/refs/heads/`, ''))
  let text = await fs.read(`${gitdir}/packed-refs`, { encoding: 'utf8' })
  if (text) {
    let refs = text
      .trim()
      .split('\n')
      .filter(x => x.includes('refs/heads'))
      .map(x => x.replace(/^.+ refs\/heads\//, '').trim())
      .filter(x => !files.includes(x)) // remove duplicates
    files = files.concat(refs)
  }
  return files
}
