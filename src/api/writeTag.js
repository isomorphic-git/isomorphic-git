// @ts-check
import '../commands/typedefs.js'

import { writeTag as _writeTag } from '../commands/writeTag.js'
import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join.js'
import { assertParameter } from '../utils/assertParameter.js'

/**
 * Write an annotated tag object directly
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {TagObject} args.tag - The object to write
 *
 * @returns {Promise<string>} Resolves successfully with the SHA-1 object id of the newly written object
 * @see TagObject
 *
 * @example
 * // Manually create an annotated tag.
 * let sha = await git.resolveRef({ dir: '$input((/))', ref: '$input((HEAD))' })
 * console.log('commit', sha)
 *
 * let oid = await git.writeTag({
 *   dir: '$input((/))',
 *   tag: {
 *     object: sha,
 *     type: 'commit',
 *     tag: '$input((my-tag))',
 *     tagger: {
 *       name: '$input((your name))',
 *       email: '$input((email@example.com))',
 *       timestamp: Math.floor(Date.now()/1000),
 *       timezoneOffset: new Date().getTimezoneOffset()
 *     },
 *     message: '$input((Optional message))'
 *   }
 * })
 *
 * console.log('tag', oid)
 *
 */
export async function writeTag ({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  tag
}) {
  try {
    assertParameter('fs', fs)
    assertParameter('gitdir', gitdir)
    assertParameter('tag', tag)

    return await _writeTag({
      fs: new FileSystem(fs),
      gitdir,
      tag
    })
  } catch (err) {
    err.caller = 'git.writeTag'
    throw err
  }
}
