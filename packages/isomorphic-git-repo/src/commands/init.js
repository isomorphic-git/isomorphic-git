// @ts-check
import { join } from '../utils/join.js'

/**
 * Initialize a new repository
 *
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string} [args.dir]
 * @param {string} [args.gitdir]
 * @param {boolean} [args.bare = false]
 * @param {string} [args.defaultBranch = 'master']
 * @returns {Promise<void>}
 */
export async function _init({
  fs,
  bare = false,
  dir,
  gitdir = bare ? dir : join(dir, '.git'),
  defaultBranch = 'master',
}) {
  // Don't overwrite an existing config
  if (await fs.exists(gitdir + '/config')) return

  let folders = [
    'hooks',
    'info',
    'objects/info',
    'objects/pack',
    'refs/heads',
    'refs/tags',
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
  await fs.write(gitdir + '/HEAD', `ref: refs/heads/${defaultBranch}\n`)
}
