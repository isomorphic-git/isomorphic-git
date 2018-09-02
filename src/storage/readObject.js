import pako from 'pako'

import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
import { GitObject } from '../models/GitObject.js'
import { readObjectLoose } from '../storage/readObjectLoose.js'
import { readObjectPacked } from '../storage/readObjectPacked.js'
import { shasum } from '../utils/shasum.js'

export async function readObject ({ fs: _fs, gitdir, oid, format = 'content' }) {
  const fs = new FileSystem(_fs)
  // Curry the current read method so that the packfile un-deltification
  // process can acquire external ref-deltas.
  const getExternalRefDelta = oid => readObject({ fs: _fs, gitdir, oid })

  // Look for it in the loose object directory.
  let result = await readObjectLoose({ fs, gitdir, oid })
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
      let buffer = Buffer.from(pako.inflate(result.object))
      result = { format: 'wrapped', object: buffer, source: result.source }
    case 'wrapped':
      if (format === 'wrapped' && result.format === 'wrapped') {
        return result
      }
      let sha = shasum(result.object)
      if (sha !== oid) {
        throw new GitError(E.InternalFail, {
          message: `SHA check failed! Expected ${oid}, computed ${sha}`
        })
      }
      let { object, type } = GitObject.unwrap(buffer)
      result = { type, format: 'content', object, source: result.source }
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
