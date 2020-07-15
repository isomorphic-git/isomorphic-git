// @ts-check
import '../typedefs.js'

import { _getRemoteTrackingBranch } from '../commands/getRemoteTrackingBranch.js'
import { FileSystem } from '../models/FileSystem.js'
import { assertParameter } from '../utils/assertParameter.js'
import { join } from '../utils/join.js'

/**
 * Find the tracked branch associated with a local branch
 *
 * @param {Object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.ref - The branch ref to find the tracking branch of
 *
 * @returns {Promise<string>} Resolves with the ref to the remote
 *
 * @example
 * await git.getRemoteTrackingBranch({ fs, dir: '/tutorial', ref: 'refs/head/main' })
 * console.log('done')
 *
 */
export async function getRemoteTrackingBranch({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  ref,
}) {
  try {
    assertParameter('fs', fs)
    assertParameter('ref', ref)
    return await _getRemoteTrackingBranch({
      fs: new FileSystem(fs),
      gitdir,
      ref,
    })
  } catch (err) {
    err.caller = 'git.getRemoteTrackingBranch'
    throw err
  }
}
