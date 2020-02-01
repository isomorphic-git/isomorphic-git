// @ts-check
import { FileSystem } from '../models/FileSystem.js'
import { GitAnnotatedTag } from '../models/GitAnnotatedTag.js'
import { GitCommit } from '../models/GitCommit.js'
import { E, GitError } from '../models/GitError.js'
import { GitTree } from '../models/GitTree.js'
import { writeObject as _writeObject } from '../storage/writeObject.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'

/**
 *
 * @typedef {Object} CommitDescription
 * @property {string} oid - SHA-1 object id of this commit
 * @property {string} message - commit message
 * @property {string} tree - SHA-1 object id of corresponding file tree
 * @property {string[]} parent - an array of zero or more SHA-1 object ids
 * @property {Object} author
 * @property {string} author.name - the author's name
 * @property {string} author.email - the author's email
 * @property {number} author.timestamp - UTC Unix timestamp in seconds
 * @property {number} author.timezoneOffset - timezone difference from UTC in minutes
 * @property {Object} committer
 * @property {string} committer.name - the committer's name
 * @property {string} committer.email - the committer's email
 * @property {number} committer.timestamp - UTC Unix timestamp in seconds
 * @property {number} committer.timezoneOffset - timezone difference from UTC in minutes
 * @property {string} [gpgsig] - PGP signature (if present)
 */

/**
 *
 * @typedef {Object} TreeEntry
 * @property {string} mode
 * @property {string} path
 * @property {string} oid
 * @property {string} [type]
 */

/**
 *
 * @typedef {Object} TreeDescription
 * @property {TreeEntry[]} entries
 */

/**
 *
 * @typedef {Object} TagDescription
 * @property {string} object
 * @property {'blob' | 'tree' | 'commit' | 'tag'} type
 * @property {string} tag
 * @property {Object} tagger
 * @property {string} tagger.name - the tagger's name
 * @property {string} tagger.email - the tagger's email
 * @property {number} tagger.timestamp - UTC Unix timestamp in seconds
 * @property {number} tagger.timezoneOffset - timezone difference from UTC in minutes
 * @property {string} message
 * @property {string} [signature] - PGP signature (if present)
 */

/**
 *
 * @typedef {Object} GitObjectDescription - The object returned has the following schema:
 * @property {string} oid
 * @property {'blob' | 'tree' | 'commit' | 'tag'} [type]
 * @property {'deflated' | 'wrapped' | 'content' | 'parsed'} format
 * @property {Uint8Array | String | CommitDescription | TreeDescription | TagDescription} object
 * @property {string} [source]
 */

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
 * If `format` is `'parsed'`, then `object` must match one of the schemas for `CommitDescription`, `TreeDescription`, or `TagDescription` described in...
 * shucks I haven't written that page yet. :( Well, described in the [TypeScript definition](https://github.com/isomorphic-git/isomorphic-git/blob/master/src/index.d.ts) for now.
 *
 * @deprecated
 * > **Deprecated**
 * > This command is overly complicated.
 * >
 * > If you know the type of object you are writing, use [`writeBlob`](./writeBlob.md), [`writeCommit`](./writeCommit.md), [`writeTag`](./writeTag.md), or [`writeTree`](./writeTree.md).
 *
 * @param {object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string | Uint8Array | CommitDescription | TreeDescription | TagDescription} args.object - The object to write.
 * @param {'blob'|'tree'|'commit'|'tag'} [args.type] - The kind of object to write.
 * @param {'deflated' | 'wrapped' | 'content' | 'parsed'} [args.format = 'parsed'] - What format the object is in. The possible choices are listed below.
 * @param {string} args.oid - If `format` is `'deflated'` then this param is required. Otherwise it is calculated.
 * @param {string} [args.encoding] - If `type` is `'blob'` then `content` will be converted to a Uint8Array using `encoding`.
 *
 * @returns {Promise<string>} Resolves successfully with the SHA-1 object id of the newly written object.
 *
 * @example
 * // Manually create an annotated tag.
 * let sha = await git.resolveRef({ dir: '$input((/))', ref: '$input((HEAD))' })
 * console.log('commit', sha)
 *
 * let oid = await git.writeObject({
 *   dir: '$input((/))',
 *   type: 'tag',
 *   object: {
 *     object: sha,
 *     type: 'commit',
 *     tag: '$input((my-tag))',
 *     tagger: {
 *       name: '$input((your name))',
 *       email: '$input((email@example.com))',
 *       timestamp: Math.floor(Date.now()/1000),
 *       timezoneOffset: new Date().getTimezoneOffset()
 *     },
 *     message: '$input((Optional message))',
 *     signature: ''
 *   }
 * })
 *
 * console.log('tag', oid)
 *
 */
export async function writeObject ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  type,
  object,
  format = 'parsed',
  oid,
  encoding = undefined
}) {
  try {
    const fs = new FileSystem(cores.get(core).get('fs'))
    // Convert object to buffer
    if (format === 'parsed') {
      switch (type) {
        case 'commit':
          object = GitCommit.from(object).toObject()
          break
        case 'tree':
          object = GitTree.from(object.entries).toObject()
          break
        case 'blob':
          object = Buffer.from(object, encoding)
          break
        case 'tag':
          object = GitAnnotatedTag.from(object).toObject()
          break
        default:
          throw new GitError(E.ObjectTypeUnknownFail, { type })
      }
    }
    // GitObjectManager does not know how to parse content, so we tweak that parameter before passing it.
    const _format = format === 'parsed' ? 'content' : format
    oid = await _writeObject({
      fs,
      gitdir,
      type,
      object,
      oid,
      format: _format
    })
    return oid
  } catch (err) {
    err.caller = 'git.writeObject'
    throw err
  }
}
