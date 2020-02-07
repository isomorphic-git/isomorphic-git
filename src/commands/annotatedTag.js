// @ts-check
import '../commands/typedefs.js'

import { GitRefManager } from '../managers/GitRefManager.js'
import { GitAnnotatedTag } from '../models/GitAnnotatedTag'
import { E, GitError } from '../models/GitError.js'
import { readObject } from '../storage/readObject.js'
import { writeObject } from '../storage/writeObject.js'
import { normalizeAuthorObject } from '../utils/normalizeAuthorObject.js'

/**
 * Create an annotated tag.
 *
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {SignCallback} [args.onPgpSign]
 * @param {string} args.gitdir
 * @param {string} args.ref
 * @param {string} [args.message = ref]
 * @param {string} [args.object = 'HEAD']
 * @param {object} [args.tagger]
 * @param {string} [args.tagger.name]
 * @param {string} [args.tagger.email]
 * @param {string} [args.tagger.date]
 * @param {string} [args.tagger.timestamp]
 * @param {string} [args.tagger.timezoneOffset]
 * @param {string} [args.signature]
 * @param {string} [args.signingKey]
 * @param {boolean} [args.force = false]
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
  fs,
  onPgpSign,
  gitdir,
  ref,
  tagger,
  message = ref,
  signature,
  object,
  signingKey,
  force = false
}) {
  ref = ref.startsWith('refs/tags/') ? ref : `refs/tags/${ref}`

  if (!force && (await GitRefManager.exists({ fs, gitdir, ref }))) {
    throw new GitError(E.RefExistsError, { noun: 'tag', ref })
  }

  // Resolve passed value
  const oid = await GitRefManager.resolve({
    fs,
    gitdir,
    ref: object || 'HEAD'
  })

  if (signature && signingKey) {
    throw new GitError(E.InvalidParameterCombinationError, {
      function: 'annotatedTag',
      parameters: ['signature', 'signingKey']
    })
  }

  // Fill in missing arguments with default values
  tagger = await normalizeAuthorObject({ fs, gitdir, author: tagger })
  if (!tagger) throw new GitError(E.MissingTaggerError)

  const { type } = await readObject({ fs, gitdir, oid })
  let tagObject = GitAnnotatedTag.from({
    object: oid,
    type,
    tag: ref.replace('refs/tags/', ''),
    tagger,
    message,
    signature
  })
  if (signingKey) {
    tagObject = await GitAnnotatedTag.sign(tagObject, onPgpSign, signingKey)
  }
  const value = await writeObject({
    fs,
    gitdir,
    type: 'tag',
    object: tagObject.toObject()
  })

  await GitRefManager.writeRef({ fs, gitdir, ref, value })
}
