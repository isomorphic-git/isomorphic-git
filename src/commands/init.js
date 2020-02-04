// @ts-check
import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join.js'

/**
 * Initialize a new repository
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {boolean} [args.bare = false] - Initialize a bare repository
 * @param {boolean} [args.noOverwrite = false] - Detect if this is already a git repo and do not re-write `.git/config`
 * @returns {Promise<void>}  Resolves successfully when filesystem operations are complete
 *
 * @example
 * await git.init({ dir: '$input((/))' })
 * console.log('done')
 *
 */
export async function init ({
  fs: _fs,
  bare = false,
  dir,
  gitdir = bare ? dir : join(dir, '.git'),
  noOverwrite = false
}) {
  try {
    const fs = new FileSystem(_fs)
    if (noOverwrite && (await fs.exists(gitdir + '/config'))) return
    let folders = [
      'hooks',
      'info',
      'objects/info',
      'objects/pack',
      'refs/heads',
      'refs/tags'
    ]
    folders = folders.map(dir => gitdir + '/' + dir)
    for (const folder of folders) {
      await fs.mkdir(folder)
    }
    await fs.write(
      gitdir + '/config',
      '[core]\n' +
        '\trepositoryformatversion = 0\n' +
        '\tfilemode = false\n' +
        `\tbare = ${bare}\n` +
        (bare ? '' : '\tlogallrefupdates = true\n') +
        '\tsymlinks = false\n' +
        '\tignorecase = true\n'
    )
    await fs.write(gitdir + '/HEAD', 'ref: refs/heads/master\n')
  } catch (err) {
    err.caller = 'git.init'
    throw err
  }
}
