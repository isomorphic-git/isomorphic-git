import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { GitAnnotatedTag } from '../models/GitAnnotatedTag'
import { E, GitError } from '../models/GitError.js'
import { readObject } from '../storage/readObject.js'
import { writeObject } from '../storage/writeObject.js'
import { join } from '../utils/join.js'
import { normalizeAuthorObject } from '../utils/normalizeAuthorObject.js'
import { cores } from '../utils/plugins.js'

/**
 * Create an annotated tag.
 *
 * @link https://isomorphic-git.github.io/docs/annotatedTag.html
 */
export async function annotatedTag ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  ref,
  tagger,
  message = ref,
  signature,
  object,
  signingKey,
  force = false
}) {
  try {
    const fs = new FileSystem(_fs)

    if (ref === undefined) {
      throw new GitError(E.MissingRequiredParameterError, {
        function: 'annotatedTag',
        parameter: 'ref'
      })
    }

    ref = ref.startsWith('refs/tags/') ? ref : `refs/tags/${ref}`

    if (!force && (await GitRefManager.exists({ fs, gitdir, ref }))) {
      throw new GitError(E.RefExistsError, { noun: 'tag', ref })
    }

    // Resolve passed value
    let oid = await GitRefManager.resolve({
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
    if (tagger === undefined) {
      throw new GitError(E.MissingTaggerError)
    }

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
      let pgp = cores.get(core).get('pgp')
      tagObject = await GitAnnotatedTag.sign(tagObject, pgp, signingKey)
    }
    let value = await writeObject({
      fs,
      gitdir,
      type: 'tag',
      object: tagObject.toObject()
    })

    await GitRefManager.writeRef({ fs, gitdir, ref, value })
  } catch (err) {
    err.caller = 'git.annotatedTag'
    throw err
  }
}
