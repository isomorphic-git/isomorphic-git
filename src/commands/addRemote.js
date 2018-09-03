import { clean } from 'clean-git-ref'
import path from 'path'

import { GitConfigManager } from '../managers/GitConfigManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
import { cores } from '../utils/plugins.js'

/**
 * Add a new remote
 *
 * @link https://isomorphic-git.github.io/docs/addRemote.html
 */
export async function addRemote ({
  core = 'default',
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  remote,
  url,
  force = false
}) {
  try {
    const fs = new FileSystem(_fs)
    if (remote === undefined) {
      throw new GitError(E.MissingRequiredParameterError, {
        function: 'addRemote',
        parameter: 'remote'
      })
    }
    if (url === undefined) {
      throw new GitError(E.MissingRequiredParameterError, {
        function: 'addRemote',
        parameter: 'url'
      })
    }
    if (remote !== clean(remote)) {
      throw new GitError(E.InvalidRefNameError, {
        verb: 'add',
        noun: 'remote',
        ref: remote,
        suggestion: clean(remote)
      })
    }
    const config = await GitConfigManager.get({ fs, gitdir })
    if (!force) {
      // Check that setting it wouldn't overwrite.
      const remoteNames = await config.getSubsections('remote')
      if (remoteNames.includes(remote)) {
        // Throw an error if it would overwrite an existing remote,
        // but not if it's simply setting the same value again.
        if (url !== (await config.get(`remote.${remote}.url`))) {
          throw new GitError(E.AddingRemoteWouldOverwrite, { remote })
        }
      }
    }
    await config.set(`remote.${remote}.url`, url)
    await config.set(
      `remote.${remote}.fetch`,
      `+refs/heads/*:refs/remotes/${remote}/*`
    )
    await GitConfigManager.save({ fs, gitdir, config })
  } catch (err) {
    err.caller = 'git.addRemote'
    throw err
  }
}
