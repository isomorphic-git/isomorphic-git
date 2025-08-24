// @ts-check
import '../typedefs.js'

import cleanGitRef from 'clean-git-ref'

import { AlreadyExistsError } from '../errors/AlreadyExistsError.js'
import { InvalidRefNameError } from '../errors/InvalidRefNameError.js'
import { GitConfigManager } from '../managers/GitConfigManager.js'

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string} args.gitdir
 * @param {string} args.remote
 * @param {string} args.url
 * @param {boolean} args.force
 *
 * @returns {Promise<void>}
 *
 */
export async function _addRemote({ fs, gitdir, remote, url, force }) {
  if (remote !== cleanGitRef.clean(remote)) {
    throw new InvalidRefNameError(remote, cleanGitRef.clean(remote))
  }
  const config = await GitConfigManager.get({ fs, gitdir })
  if (!force) {
    // Check that setting it wouldn't overwrite.
    const remoteNames = await config.getSubsections('remote')
    if (remoteNames.includes(remote)) {
      // Throw an error if it would overwrite an existing remote,
      // but not if it's simply setting the same value again.
      if (url !== (await config.get(`remote.${remote}.url`))) {
        throw new AlreadyExistsError('remote', remote)
      }
    }
  }
  await config.set(`remote.${remote}.url`, url)
  await config.set(
    `remote.${remote}.fetch`,
    `+refs/heads/*:refs/remotes/${remote}/*`
  )
  await GitConfigManager.save({ fs, gitdir, config })
}
