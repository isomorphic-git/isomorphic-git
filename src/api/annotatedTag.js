// @ts-check
import '../commands/typedefs.js'

import { annotatedTag as _annotatedTag } from '../commands/annotatedTag.js'
import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
import { assertParameter } from '../utils/assertParameter.js'
import { join } from '../utils/join.js'
import { normalizeAuthorObject } from '../utils/normalizeAuthorObject.js'

/**
 * Create an annotated tag.
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {SignCallback} [args.onSign] - a PGP signing implementation
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.ref - What to name the tag
 * @param {string} [args.message = ref] - The tag message to use.
 * @param {string} [args.object = 'HEAD'] - The SHA-1 object id the tag points to. (Will resolve to a SHA-1 object id if value is a ref.) By default, the commit object which is referred by the current `HEAD` is used.
 * @param {object} [args.tagger] - The details about the tagger.
 * @param {string} [args.tagger.name] - Default is `user.name` config.
 * @param {string} [args.tagger.email] - Default is `user.email` config.
 * @param {Date} [args.tagger.date] - Set the tagger timestamp field. Default is the current date.
 * @param {number} [args.tagger.timestamp] - Set the tagger timestamp field. This is an alternative to using `date` using an integer number of seconds since the Unix epoch instead of a JavaScript date object.
 * @param {number} [args.tagger.timezoneOffset] - Set the tagger timezone offset field. This is the difference, in minutes, from the current timezone to UTC. Default is `(new Date()).getTimezoneOffset()`.
 * @param {string} [args.signature] - The signature attatched to the tag object. (Mutually exclusive with the `signingKey` option.)
 * @param {string} [args.signingKey] - Sign the tag object using this private PGP key. (Mutually exclusive with the `signature` option.)
 * @param {boolean} [args.force = false] - Instead of throwing an error if a tag named `ref` already exists, overwrite the existing tag. Note that this option does not modify the original tag object itself.
 *
 * @returns {Promise<void>} Resolves successfully when filesystem operations are complete
 *
 * @example
 * await git.annotatedTag({
 *   dir: '$input((/))',
 *   ref: '$input((test-tag))',
 *   message: '$input((This commit is awesome))',
 *   tagger: {
 *     name: '$input((Mr. Test))',
 *     email: '$input((mrtest@example.com))'
 *   }
 * })
 * console.log('done')
 *
 */
export async function annotatedTag ({
  fs: _fs,
  onSign,
  dir,
  gitdir = join(dir, '.git'),
  ref,
  tagger: _tagger,
  message = ref,
  signature,
  object,
  signingKey,
  force = false
}) {
  try {
    assertParameter('fs', _fs)
    assertParameter('gitdir', gitdir)
    assertParameter('ref', ref)
    if (signingKey) {
      assertParameter('onSign', onSign)
    }
    const fs = new FileSystem(_fs)

    // Fill in missing arguments with default values
    const tagger = await normalizeAuthorObject({ fs, gitdir, author: _tagger })
    if (!tagger) throw new GitError(E.MissingTaggerError)

    return await _annotatedTag({
      fs,
      onSign,
      gitdir,
      ref,
      tagger,
      message,
      signature,
      object,
      signingKey,
      force
    })
  } catch (err) {
    err.caller = 'git.annotatedTag'
    throw err
  }
}
