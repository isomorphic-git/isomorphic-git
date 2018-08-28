import pako from 'pako'

import * as GitObjectStoreLoose from '../managers/GitObjectStoreLoose.js'
import * as GitObjectStorePacked from '../managers/GitObjectStorePacked.js'
import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
import { GitObject } from '../models/GitObject.js'
import { shasum } from '../utils/shasum.js'

export async function readObject ({ fs: _fs, gitdir, oid, format = 'content' }) {
  const fs = new FileSystem(_fs)
  // Curry the current read method so that the packfile un-deltification
  // process can acquire external ref-deltas.
  const getExternalRefDelta = oid => readObject({ fs: _fs, gitdir, oid })

  // Look for it in the loose object directory.
  let result = await GitObjectStoreLoose.read({ fs, gitdir, oid })
  // Check to see if it's in a packfile.
  if (!result) {
    result = await GitObjectStorePacked.read({ fs, gitdir, oid, getExternalRefDelta })
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

export async function hash ({ gitdir, type, object }) {
  return shasum(GitObject.wrap({ type, object }))
}

export async function expandOid ({ fs: _fs, gitdir, oid: short }) {
  const fs = new FileSystem(_fs)
  // Curry the current read method so that the packfile un-deltification
  // process can acquire external ref-deltas.
  const getExternalRefDelta = oid => readObject({ fs: _fs, gitdir, oid })

  const results1 = await GitObjectStoreLoose.expandOid({ fs, gitdir, oid: short })
  const results2 = await GitObjectStorePacked.expandOid({ fs, gitdir, oid: short, getExternalRefDelta })
  const results = results1.concat(results2)

  if (results.length === 1) {
    return results[0]
  }
  if (results.length > 1) {
    throw new GitError(E.AmbiguousShortOid, {
      short,
      matches: results.join(', ')
    })
  }
  throw new GitError(E.ShortOidNotFound, { short })
}

export async function writeObject ({ fs: _fs, gitdir, type, object, format = 'content', oid }) {
  const fs = new FileSystem(_fs)
  if (format !== 'deflated') {
    if (format !== 'wrapped') {
      object = GitObject.wrap({ type, object })
    }
    oid = shasum(object)
    object = Buffer.from(pako.deflate(object))
  }
  await GitObjectStoreLoose.write({ fs, gitdir, object, format: 'deflated', oid })
  return oid
}
