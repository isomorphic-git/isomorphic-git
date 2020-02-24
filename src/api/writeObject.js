// @ts-check
import '../typedefs.js'

import { ObjectTypeError } from '../errors/ObjectTypeError.js'
import { FileSystem } from '../models/FileSystem.js'
import { GitAnnotatedTag } from '../models/GitAnnotatedTag.js'
import { GitCommit } from '../models/GitCommit.js'
import { GitTree } from '../models/GitTree.js'
import { _writeObject } from '../storage/writeObject.js'
import { join } from '../utils/join.js'

/**
 * Write a git object directly
 *
 * `format` can have the following values:
 *
 * | param      | description                                                                                                                                                      |
 * | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
 * | 'deflated' | Treat `object` as the raw deflate-compressed buffer for an object, meaning can be written to `.git/objects/**` as-is.                                           |
 * | 'wrapped'  | Treat `object` as the inflated object buffer wrapped in the git object header. This is the raw buffer used when calculating the SHA-1 object id of a git object. |
 * | 'content'  | Treat `object` as the object buffer without the git header.                                                                                                      |
 * | 'parsed'   | Treat `object` as a parsed representation of the object.                                                                                                         |
 *
 * If `format` is `'parsed'`, then `object` must match one of the schemas for `CommitObject`, `TreeObject`, `TagObject`, or a `string` (for blobs).
 *
 * {@link CommitObject typedef}
 *
 * {@link TreeObject typedef}
 *
 * {@link TagObject typedef}
 *
 * If `format` is `'content'`, `'wrapped'`, or `'deflated'`, `object` should be a `Uint8Array`.
 *
 * @deprecated
 * > This command is overly complicated.
 * >
 * > If you know the type of object you are writing, use [`writeBlob`](./writeBlob.md), [`writeCommit`](./writeCommit.md), [`writeTag`](./writeTag.md), or [`writeTree`](./writeTree.md).
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string | Uint8Array | CommitObject | TreeObject | TagObject} args.object - The object to write.
 * @param {'blob'|'tree'|'commit'|'tag'} [args.type] - The kind of object to write.
 * @param {'deflated' | 'wrapped' | 'content' | 'parsed'} [args.format = 'parsed'] - What format the object is in. The possible choices are listed below.
 * @param {string} [args.oid] - If `format` is `'deflated'` then this param is required. Otherwise it is calculated.
 * @param {string} [args.encoding] - If `type` is `'blob'` then `object` will be converted to a Uint8Array using `encoding`.
 *
 * @returns {Promise<string>} Resolves successfully with the SHA-1 object id of the newly written object.
 *
 * @example
 * // Manually create an annotated tag.
 * let sha = await git.resolveRef({ fs, dir: '/tutorial', ref: 'HEAD' })
 * console.log('commit', sha)
 *
 * let oid = await git.writeObject({
 *   fs,
 *   dir: '/tutorial',
 *   type: 'tag',
 *   object: {
 *     object: sha,
 *     type: 'commit',
 *     tag: 'my-tag',
 *     tagger: {
 *       name: 'your name',
 *       email: 'email@example.com',
 *       timestamp: Math.floor(Date.now()/1000),
 *       timezoneOffset: new Date().getTimezoneOffset()
 *     },
 *     message: 'Optional message'
 *   }
 * })
 *
 * console.log('tag', oid)
 *
 */
export async function writeObject({
  fs: _fs,
  dir,
  gitdir = join(dir, '.git'),
  type,
  object,
  format = 'parsed',
  oid,
  encoding = undefined,
}) {
  try {
    const fs = new FileSystem(_fs)
    // Convert object to buffer
    if (format === 'parsed') {
      switch (type) {
        case 'commit':
          object = GitCommit.from(object).toObject()
          break
        case 'tree':
          object = GitTree.from(object).toObject()
          break
        case 'blob':
          object = Buffer.from(object, encoding)
          break
        case 'tag':
          object = GitAnnotatedTag.from(object).toObject()
          break
        default:
          throw new ObjectTypeError(oid || '', type, 'blob|commit|tag|tree')
      }
      // GitObjectManager does not know how to serialize content, so we tweak that parameter before passing it.
      format = 'content'
    }
    oid = await _writeObject({
      fs,
      gitdir,
      type,
      object,
      oid,
      format,
    })
    return oid
  } catch (err) {
    err.caller = 'git.writeObject'
    throw err
  }
}
