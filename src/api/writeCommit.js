// @ts-check
import '../typedefs.js'

import { _writeCommit } from '../commands/writeCommit.js'
import { FileSystem } from '../models/FileSystem.js'
import { assertParameter } from '../utils/assertParameter.js'
import { discoverGitdir } from '../utils/discoverGitdir.js'
import { join } from '../utils/join.js'

/**
 * Write a commit object directly
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {CommitObject} args.commit - The object to write
 *
 * @returns {Promise<string>} Resolves successfully with the SHA-1 object id of the newly written object
 * @see CommitObject
 *
 */
export async function writeCommit({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  commit,
}) {
  try {
    assertParameter('fs', fs)
    assertParameter('gitdir', gitdir)
    assertParameter('commit', commit)

    const fsp = new FileSystem(fs)
    const updatedGitdir = await discoverGitdir({ fsp, dotgit: gitdir })
    return await _writeCommit({
      fs: fsp,
      gitdir: updatedGitdir,
      commit,
    })
  } catch (err) {
    err.caller = 'git.writeCommit'
    throw err
  }
}
