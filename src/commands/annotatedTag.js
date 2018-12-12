import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { GitAnnotatedTag } from '../models/GitAnnotatedTag'
import { E, GitError } from '../models/GitError.js'
import { readObject } from '../storage/readObject.js'
import { writeObject } from '../storage/writeObject.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'

import { config } from './config.js'

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
  message = '',
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
    if (tagger === undefined) tagger = {}
    if (tagger.name === undefined) {
      tagger.name = await config({ fs, gitdir, path: 'user.name' })
    }
    if (tagger.email === undefined) {
      tagger.email = await config({ fs, gitdir, path: 'user.email' })
    }
    if (tagger.name === undefined || tagger.email === undefined) {
      throw new GitError(E.MissingAuthorError)
    }

    const { type } = await readObject({ fs, gitdir, oid })
    let taggerDateTime = tagger.date || new Date()
    let tagObject = GitAnnotatedTag.from({
      object: oid,
      type,
      tag: ref.replace('refs/tags/', ''),
      tagger: {
        name: tagger.name,
        email: tagger.email,
        timestamp:
          tagger.timestamp !== undefined && tagger.timestamp !== null
            ? tagger.timestamp
            : Math.floor(taggerDateTime.valueOf() / 1000),
        timezoneOffset:
          tagger.timezoneOffset !== undefined && tagger.timezoneOffset !== null
            ? tagger.timezoneOffset
            : taggerDateTime.getTimezoneOffset()
      },
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
