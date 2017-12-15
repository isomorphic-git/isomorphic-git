import { FileSystem } from '../models'

/**
 * Initialize a new repository
 *
 * @param {GitRepo} repo - A {@link Git} object matching `{gitdir, fs}`
 * @returns {Promise<void>} - Resolves successfully when filesystem operations are complete.
 *
 * @example
 * let repo = new Git({fs, dir: '.'})
 * await init(repo)
 */
export async function init ({ gitdir, fs: _fs }) {
  const fs = new FileSystem(_fs)
  let folders = [
    'hooks',
    'info',
    'objects/info',
    'objects/pack',
    'refs/heads',
    'refs/tags'
  ]
  folders = folders.map(dir => gitdir + '/' + dir)
  for (let folder of folders) {
    await fs.mkdir(folder)
  }
  await fs.write(
    gitdir + '/config',
    '[core]\n' +
      '\trepositoryformatversion = 0\n' +
      '\tfilemode = false\n' +
      '\tbare = false\n' +
      '\tlogallrefupdates = true\n' +
      '\tsymlinks = false\n' +
      '\tignorecase = true\n'
  )
  await fs.write(gitdir + '/HEAD', 'ref: refs/heads/master\n')
}
