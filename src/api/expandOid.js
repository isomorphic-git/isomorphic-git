// @ts-check
import { FileSystem } from '../models/FileSystem.js'
import { expandOid as _expandOid } from '../storage/expandOid.js'
import { join } from '../utils/join.js'
import { assertParameter } from '../utils/assertParameter.js'

/**
 * Expand and resolve a short oid into a full oid
 *
 * @param {Object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.oid - The shortened oid prefix to expand (like "0414d2a")
 *
 * @returns {Promise<string>} Resolves successfully with the full oid (like "0414d2a286d7bbc7a4a326a61c1f9f888a8ab87f")
 *
 * @example
 * let oid = await git.expandOid({ dir: '$input((/))', oid: '$input((0414d2a))'})
 * console.log(oid)
 *
 */
export async function expandOid ({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  oid
}) {
  try {
    assertParameter('fs', fs)
    assertParameter('gitdir', gitdir)
    assertParameter('oid', oid)
    return await _expandOid({
      fs: new FileSystem(fs),
      gitdir,
      oid
    })
  } catch (err) {
    err.caller = 'git.expandOid'
    throw err
  }
}
