import { writeObject } from './writeObject'
import { readObject } from './readObject'
import { writeRef } from './writeRef'
import { config } from './config'
import { resolveRef } from './resolveRef'
import { currentBranch } from './currentBranch'
import { E, GitError } from '../models/GitError.js'
import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'
import { GitAnnotatedTag } from '../models/GitAnnotatedTag'

/**
 * Create a lightweight or annotated tag.
 *
 * @link https://isomorphic-git.github.io/docs/tag.html
 */
export async function tag ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  name,
  annotated = undefined,
  oid = undefined
}) {
  try {
    const fs = new FileSystem(_fs)
    const ref = 'refs/tags/' + name

    let referredOid = oid || await resolveRef({ fs, gitdir, ref: await currentBranch({ gitdir, fullname: true }) })

    if (annotated) {
      const message = annotated.message
      let tagger = annotated.tagger
      const signingKey = annotated.signingKey
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
          parameter: 'message'
        })
      }
      const referredObjectType = (await readObject({ fs, gitdir, oid: referredOid })).type
      let taggerDateTime = tagger.date || new Date()
      let tag = GitAnnotatedTag.from({
        object: referredOid,
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
        message
      })
      if (signingKey) {
        let pgp = cores.get(core).get('pgp')
        tag = await GitAnnotatedTag.sign(tag, pgp, signingKey)
      }
      referredOid = await writeObject({ fs, dir, type: 'tag', object: tag.toObject() })
    }

    await writeRef({ fs, gitdir, ref, value: referredOid })
  } catch (err) {
    err.caller = 'git.tag'
    throw err
  }
}
