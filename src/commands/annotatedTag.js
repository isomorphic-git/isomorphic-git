import { writeObject } from './writeObject'
import { readObject } from './readObject'
import { config } from './config'
import { GitRefManager } from '../managers/GitRefManager'
import { E, GitError } from '../models/GitError.js'
import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'
import { GitAnnotatedTag } from '../models/GitAnnotatedTag'

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
  name,
  object,
  signingKey = undefined,
  force = false
}) {
  try {
    const fs = new FileSystem(_fs)
    const ref = 'refs/tags/' + name

    if (object === undefined) {
      throw new GitError(E.MissingRequiredParameterError, {
        function: 'annotatedTag',
        parameter: 'object'
      })
    }

    if (!force) {
      const exist = await fs.exists(`${gitdir}/${ref}`)
      if (exist) {
        throw new GitError(E.RefExistsError, { noun: 'tag', ref: name })
      }
    }

    // Resolve passed value
    let value = await GitRefManager.resolve({
      fs,
      gitdir,
      ref: object.object || 'HEAD'
    })

    const message = object.message
    const signature = object.signature
    if (signature && signingKey) {
      throw new GitError(E.InvalidParameterCombinationError, {
        function: 'annotatedTag',
        parameters: ['object.signature', 'signingKey']
      })
    }
    let tagger = object.tagger
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
    if (message === undefined) {
      throw new GitError(E.MissingRequiredParameterError, {
        function: 'tag',
        parameter: 'annotated.message'
      })
    }
    const referredObjectType = (await readObject({ fs, gitdir, oid: value })).type
    let taggerDateTime = tagger.date || new Date()
    let tag = GitAnnotatedTag.from({
      object: value,
      type: referredObjectType,
      tag: name,
      tagger: {
        name: tagger.name,
        email: tagger.email,
        timestamp:
            tagger.timestamp !== undefined && tagger.timestamp !== null
              ? tagger.timestamp
              : Math.floor(taggerDateTime.valueOf() / 1000),
        timezoneOffset:
            tagger.timezoneOffset !== undefined &&
            tagger.timezoneOffset !== null
              ? tagger.timezoneOffset
              : new Date().getTimezoneOffset()
      },
      message,
      signature
    })
    if (signingKey) {
      let pgp = cores.get(core).get('pgp')
      tag = await GitAnnotatedTag.sign(tag, pgp, signingKey)
    }
    value = await writeObject({ fs, gitdir, type: 'tag', object: tag.toObject() })

    await GitRefManager.writeRef({ fs, gitdir, ref, value })
  } catch (err) {
    err.caller = 'git.annotatedTag'
    throw err
  }
}
