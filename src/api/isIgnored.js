// @ts-check
import '../typedefs.js'

import { GitIgnoreManager } from '../managers/GitIgnoreManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { assertParameter } from '../utils/assertParameter.js'
import { join } from '../utils/join.js'

/**
 * Test whether a filepath should be ignored (because of .gitignore or .git/exclude)
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} args.dir - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir, '.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.filepath - The filepath to test
 *
 * @returns {Promise<boolean>} Resolves to true if the file should be ignored
 *
 * @example
 * await git.isIgnored({ fs, dir: '/tutorial', filepath: 'docs/add.md' })
 *
 */
export async function isIgnored({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  filepath,
}) {
  try {
    assertParameter('fs', fs)
    assertParameter('dir', dir)
    assertParameter('gitdir', gitdir)
    assertParameter('filepath', filepath)

    return GitIgnoreManager.isIgnored({
      fs: new FileSystem(fs),
      dir,
      gitdir,
      filepath,
    })
  } catch (err) {
    err.caller = 'git.isIgnored'
    throw err
  }
}
