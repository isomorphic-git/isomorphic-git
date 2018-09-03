import path from 'path'

import { FileSystem } from '../models/FileSystem.js'
import { cores } from '../utils/plugins.js'

/**
 * Initialize a new repository
 *
 * @link https://isomorphic-git.github.io/docs/init.html
 */
export async function init ({
  core = 'default',
  dir,
  gitdir = path.join(dir, '.git'),
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
  } catch (err) {
    err.caller = 'git.init'
    throw err
  }
}
