// @ts-check
import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'

/**
 * Initialize a new repository
 *
 * @param {object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {FileSystem} [args.fs] - [deprecated] The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {boolean} [args.bare = false] - Initialize a bare repository
 * @returns {Promise<void>}  Resolves successfully when filesystem operations are complete
 *
 * @example
 * await git.init({ dir: '$input((/))' })
 * console.log('done')
 *
 */
export async function init ({
  core = 'default',
  bare = false,
  dir,
  gitdir = bare ? dir : join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs')
}) {
  try {
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
