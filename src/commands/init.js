import path from 'path'
import { FileSystem } from '../models'

/**
 * Initialize a new repository
 *
 * @param {Object} args - Arguments object
 * @param {FSModule} args.fs - The filesystem holding the git repo
 * @param {string} args.dir - The path to the [working tree](index.html#dir-vs-gitdir) directory
 * @param {string} [args.gitdir=path.join(dir, '.git')] - The path to the [git directory](index.html#dir-vs-gitdir)
 * @returns {Promise<void>} - Resolves successfully when filesystem operations are complete.
 *
 * @example
 * let repo = {fs, dir: '.'}
 * await git.init(repo)
 */
export async function init ({ dir, gitdir = path.join(dir, '.git'), fs: _fs }) {
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
