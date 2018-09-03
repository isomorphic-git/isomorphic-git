import path from 'path'

import { GitConfigManager } from '../managers/GitConfigManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
import { cores } from '../utils/plugins.js'

/**
 * Delete an existing remote
 *
 * @link https://isomorphic-git.github.io/docs/deleteRemote.html
 */
export async function deleteRemote ({
  core = 'default',
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  remote
}) {
  try {
    const fs = new FileSystem(_fs)
    if (remote === undefined) {
      throw new GitError(E.MissingRequiredParameterError, {
        function: 'deleteRemote',
        parameter: 'remote'
      })
    }
    const config = await GitConfigManager.get({ fs, gitdir })
    await config.deleteSection('remote', remote)
    await GitConfigManager.save({ fs, gitdir, config })
  } catch (err) {
    err.caller = 'git.deleteRemote'
    throw err
  }
}
