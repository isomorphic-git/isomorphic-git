import { InternalError } from '../errors/InternalError.js'
import { NotFoundError } from '../errors/NotFoundError.js'
import { GitObject } from '../models/GitObject.js'
import { readObjectLoose } from '../storage/readObjectLoose.js'
import { readObjectPacked } from '../storage/readObjectPacked.js'
import { inflate } from '../utils/inflate.js'
import { shasum } from '../utils/shasum.js'

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {any} args.cache
 * @param {string} args.gitdir
 * @param {string} args.oid
 * @param {string} [args.format]
 */
export async function _readObject({
  fs,
  cache,
  gitdir,
  oid,
  format = 'content',
}) {
  // Curry the current read method so that the packfile un-deltification
  // process can acquire external ref-deltas.
  const getExternalRefDelta = oid => _readObject({ fs, cache, gitdir, oid })

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
    result = await readObjectPacked({
      fs,
      cache,
      gitdir,
      oid,
      getExternalRefDelta,
    })

    if (!result) {
      throw new NotFoundError(oid)
    }

    // Directly return packed result, as specified: packed objects always return the 'content' format.
    return result
  }

  // Loose objects are always deflated, return early
  if (format === 'deflated') {
    return result
  }

  // All loose objects are deflated but the hard-coded empty tree is `wrapped` so we have to check if we need to inflate the object.
  if (result.format === 'deflated') {
    result.object = Buffer.from(await inflate(result.object))
    result.format = 'wrapped'
  }

  if (format === 'wrapped') {
    return result
  }

  const sha = await shasum(result.object)
  if (sha !== oid) {
    throw new InternalError(
      `SHA check failed! Expected ${oid}, computed ${sha}`
    )
  }
  const { object, type } = GitObject.unwrap(result.object)
  result.type = type
  result.object = object
  result.format = 'content'

  if (format === 'content') {
    return result
  }

  throw new InternalError(`invalid requested format "${format}"`)
}
