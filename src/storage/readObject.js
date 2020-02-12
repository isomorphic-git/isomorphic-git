import { E, GitError } from '../models/GitError.js'
import { GitObject } from '../models/GitObject.js'
import { readObjectLoose } from '../storage/readObjectLoose.js'
import { readObjectPacked } from '../storage/readObjectPacked.js'
import { inflate } from '../utils/inflate.js'
import { shasum } from '../utils/shasum.js'

export async function readObject ({ fs, gitdir, oid, format = 'content' }) {
  // Curry the current read method so that the packfile un-deltification
  // process can acquire external ref-deltas.
  const getExternalRefDelta = oid => readObject({ fs, gitdir, oid })

  let result
  // Empty tree - hard-coded so we can use it as a shorthand.
  // Note: I think the canonical git implementation must do this too because
  // `git cat-file -t 4b825dc642cb6eb9a060e54bf8d69288fbee4904` prints "tree" even in empty repos.
  if (oid === '4b825dc642cb6eb9a060e54bf8d69288fbee4904') {
    result = { format: 'wrapped', object: Buffer.from(`tree 0\x00`) }
  }
  // Look for it in the loose object directory.
  if (!result) {
    result = await readObjectLoose({ fs, gitdir, oid })
  }
  // Check to see if it's in a packfile.
  if (!result) {
    result = await readObjectPacked({ fs, gitdir, oid, getExternalRefDelta })
  }
  // Finally
  if (!result) {
    throw new GitError(E.ReadObjectFail, { oid })
  }

  if (format === 'deflated') {
    return result
  }

  // BEHOLD! THE ONLY TIME I'VE EVER WANTED TO USE A CASE STATEMENT WITH FOLLOWTHROUGH!
  // eslint-ignore
  /* eslint-disable no-fallthrough */
  switch (result.format) {
    case 'deflated':
      result.object = Buffer.from(await inflate(result.object))
      result.format = 'wrapped'
    case 'wrapped':
      if (format === 'wrapped' && result.format === 'wrapped') {
        return result
      }
      const sha = await shasum(result.object)
      if (sha !== oid) {
        throw new GitError(E.InternalFail, {
          message: `SHA check failed! Expected ${oid}, computed ${sha}`
        })
      }
      const { object, type } = GitObject.unwrap(result.object)
      result.type = type
      result.object = object
      result.format = 'content'
    case 'content':
      if (format === 'content') return result
      break
    default:
      throw new GitError(E.InternalFail, {
        message: `invalid format "${result.format}"`
      })
  }
  /* eslint-enable no-fallthrough */
}
