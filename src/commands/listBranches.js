import { FileSystem } from '../models'

/**
 * List all local branches
 *
 * @param {GitRepo} repo - A {@link Git} object matching `{gitdir, fs}`
 * @returns {Promise<string[]>} - Resolves successfully with an array of branch names.
 *
 * @example
 * let repo = new Git({fs, dir: '.'})
 * let branches = await listBranches(repo)
 */
export async function listBranches ({ gitdir, fs: _fs }) {
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
