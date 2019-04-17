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
 * @param {object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {FileSystem} [args.fs] - [deprecated] The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {Buffer|string|Object} args.object - The object to write.
 * @param {'blob'|'tree'|'commit'|'tag'} args.type - The kind of object to write.
 * @param {'deflated' | 'wrapped' | 'content' | 'parsed'} [args.format = 'parsed'] - What format the object is in. The possible choices are listed below.
 * @param {string} args.oid - If `format` is `'deflated'` then this param is required. Otherwise it is calculated.
 * @param {string} [args.filepath] - Don't return the object with `oid` itself, but resolve `oid` to a tree and then return the object at that filepath. To return the root directory of a tree set filepath to `''`
 * @param {string} [args.encoding] - If `type` is `'blob'` then `content` will be converted to a Buffer using `encoding`.
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
  fs: _fs = cores.get(core).get('fs'),
  type,
  object,
  format = 'parsed',
  oid,
  encoding = undefined
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
