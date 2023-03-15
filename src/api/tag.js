// @ts-check
import { AlreadyExistsError } from '../errors/AlreadyExistsError.js'
import { MissingParameterError } from '../errors/MissingParameterError.js'
import { GitRefManager } from '../managers/GitRefManager'
import { FileSystem } from '../models/FileSystem.js'
import { assertParameter } from '../utils/assertParameter'
import { join } from '../utils/join.js'

/**
 * Create a lightweight tag
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.ref - What to name the tag
 * @param {string} [args.object = 'HEAD'] - What oid the tag refers to. (Will resolve to oid if value is a ref.) By default, the commit object which is referred by the current `HEAD` is used.
 * @param {boolean} [args.force = false] - Instead of throwing an error if a tag named `ref` already exists, overwrite the existing tag.
 *
 * @returns {Promise<void>} Resolves successfully when filesystem operations are complete
 *
 * @example
 * await git.tag({ fs, dir: '/tutorial', ref: 'test-tag' })
 * console.log('done')
 *
 */
export async function tag({
  fs: _fs,
  dir,
  gitdir = join(dir, '.git'),
  ref,
  object,
  force = false,
}) {
  try {
    assertParameter('fs', _fs)
    assertParameter('gitdir', gitdir)
    assertParameter('ref', ref)

    const fs = new FileSystem(_fs)

    if (ref === undefined) {
      throw new MissingParameterError('ref')
    }

    ref = ref.startsWith('refs/tags/') ? ref : `refs/tags/${ref}`

    // Resolve passed object
    const value = await GitRefManager.resolve({
      fs,
      gitdir,
      ref: object || 'HEAD',
    })

    if (!force && (await GitRefManager.exists({ fs, gitdir, ref }))) {
      throw new AlreadyExistsError('tag', ref)
    }

    await GitRefManager.writeRef({ fs, gitdir, ref, value })
  } catch (err) {
    err.caller = 'git.tag'
    throw err
  }
}
