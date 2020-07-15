// @ts-check
import '../typedefs.js'

import { GitConfigManager } from '../managers/GitConfigManager'
import { GitRefSpecSet } from '../models/GitRefSpecSet'

/**
 * Get the remote tracking branch.
 *
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string} args.gitdir
 * @param {string} args.ref
 *
 * @returns {Promise<string>} Resolves the tracked branch ref
 *
 */
export async function _getRemoteTrackingBranch({ fs, gitdir, ref }) {
  ref = ref.startsWith('refs/heads/') ? ref : `refs/heads/${ref}`

  const config = await GitConfigManager.get({ fs, gitdir })

  const remoteNames = await config.getSubsections(`remote`)

  const fetches = await Promise.all(
    remoteNames.map(remote => {
      return config.get(`remote.${remote}.fetch`)
    })
  )

  const refspec = new GitRefSpecSet()

  for (const fetch of fetches) {
    refspec.add(fetch)
  }

  return refspec.translateOne(ref)
}
