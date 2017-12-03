import { write, mkdirs, fs as defaultfs, setfs } from '../utils'

/**
 * Initialize a new repository
 *
 * @param {GitRepo} repo - A {@link Git} object matching `{gitdir, fs}`
 * @returns {Promise<void>} - Resolves successfully when filesystem operations are complete.
 *
 * @example
 * import fs from 'fs'
 * import { Git, init } from 'isomorphic-git'
 *
 * let repo = new Git({fs, dir: './path/to/repo'})
 * await init(repo)
 */
export async function init ({ gitdir, fs = defaultfs() }) {
  setfs(fs)
  let folders = [
    'hooks',
    'info',
    'objects/info',
    'objects/pack',
    'refs/heads',
    'refs/tags'
  ]
  folders = folders.map(dir => gitdir + '/' + dir)
  await mkdirs(folders)
  await write(
    gitdir + '/config',
    '[core]\n' +
      '\trepositoryformatversion = 0\n' +
      '\tfilemode = false\n' +
      '\tbare = false\n' +
      '\tlogallrefupdates = true\n' +
      '\tsymlinks = false\n' +
      '\tignorecase = true\n'
  )
  await write(gitdir + '/HEAD', 'ref: refs/heads/master\n')
}
