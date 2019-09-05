// @ts-check
import cleanGitRef from 'clean-git-ref'

import { GitConfigManager } from '../managers/GitConfigManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'

/**
 * Add or update a remote
 *
 * @param {object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {FileSystem} [args.fs] - [deprecated] The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).
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
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
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
    if (remote !== cleanGitRef.clean(remote)) {
      throw new GitError(E.InvalidRefNameError, {
        verb: 'add',
        noun: 'remote',
        ref: remote,
        suggestion: cleanGitRef.clean(remote)
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
