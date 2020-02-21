// @ts-check
import '../typedefs.js'

import { _listRemotes } from '../commands/listRemotes.js'
import { FileSystem } from '../models/FileSystem.js'
import { assertParameter } from '../utils/assertParameter.js'
import { join } from '../utils/join.js'

/**
 * List remotes
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 *
 * @returns {Promise<Array<{remote: string, url: string}>>} Resolves successfully with an array of `{remote, url}` objects
 *
 * @example
 * let remotes = await git.listRemotes({ fs, dir: '/tutorial' })
 * console.log(remotes)
 *
 */
export async function listRemotes({ fs, dir, gitdir = join(dir, '.git') }) {
  try {
    assertParameter('fs', fs)
    assertParameter('gitdir', gitdir)

    return await _listRemotes({
      fs: new FileSystem(fs),
      gitdir,
    })
  } catch (err) {
    err.caller = 'git.listRemotes'
    throw err
  }
}
