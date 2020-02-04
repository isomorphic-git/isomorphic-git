// @ts-check
import '../commands/typedefs.js'

import { addRemote as _addRemote } from '../commands/addRemote.js'
import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join.js'
import { assertParameter } from '../utils/assertParameter.js'

/**
 * Add or update a remote
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.remote - The name of the remote
 * @param {string} args.url - The URL of the remote
 * @param {boolean} [args.force = false] - Instead of throwing an error if a remote named `remote` already exists, overwrite the existing remote.
 *
 * @returns {Promise<void>} Resolves successfully when filesystem operations are complete
 *
 * @example
 * await git.addRemote({ dir: '$input((/))', remote: '$input((upstream))', url: '$input((https://github.com/isomorphic-git/isomorphic-git))' })
 * console.log('done')
 *
 */
export async function addRemote ({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  remote,
  url,
  force = false
}) {
  try {
    assertParameter('fs', fs)
    assertParameter('gitdir', gitdir)
    assertParameter('remote', remote)
    assertParameter('url', url)
    return await _addRemote({
      fs: new FileSystem(fs),
      gitdir,
      remote,
      url,
      force
    })
  } catch (err) {
    err.caller = 'git.addRemote'
    throw err
  }
}
