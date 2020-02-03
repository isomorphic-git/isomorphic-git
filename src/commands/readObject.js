// @ts-check
import '../commands/typedefs.js'

import { FileSystem } from '../models/FileSystem.js'
import { GitAnnotatedTag } from '../models/GitAnnotatedTag.js'
import { GitCommit } from '../models/GitCommit.js'
import { E, GitError } from '../models/GitError.js'
import { GitTree } from '../models/GitTree.js'
import { readObject as _readObject } from '../storage/readObject.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'
import { resolveTree } from '../utils/resolveTree.js'

/**
 *
 * @typedef {Object} DeflatedObject
 * @property {string} oid
 * @property {'deflated'} type
 * @property {'deflated'} format
 * @property {Uint8Array} object
 * @property {string} [source]
 *
 */

/**
 *
 * @typedef {Object} WrappedObject
 * @property {string} oid
 * @property {'wrapped'} type
 * @property {'wrapped'} format
 * @property {Uint8Array} object
 * @property {string} [source]
 *
 */

/**
 *
 * @typedef {Object} RawObject
 * @property {string} oid
 * @property {'blob'|'commit'|'tree'|'tag'} type
 * @property {'content'} format
 * @property {Uint8Array} object
 * @property {string} [source]
 *
 */

/**
 *
 * @typedef {Object} ParsedBlobObject
 * @property {string} oid
 * @property {'blob'} type
 * @property {'parsed'} format
 * @property {string} object
 * @property {string} [source]
 *
 */

/**
 *
 * @typedef {Object} ParsedCommitObject
 * @property {string} oid
 * @property {'commit'} type
 * @property {'parsed'} format
 * @property {CommitObject} object
 * @property {string} [source]
 *
 */

/**
 *
 * @typedef {Object} ParsedTreeObject
 * @property {string} oid
 * @property {'tree'} type
 * @property {'parsed'} format
 * @property {TreeObject} object
 * @property {string} [source]
 *
 */

/**
 *
 * @typedef {Object} ParsedTagObject
 * @property {string} oid
 * @property {'tag'} type
 * @property {'parsed'} format
 * @property {TagObject} object
 * @property {string} [source]
 *
 */

/**
 *
 * @typedef {ParsedBlobObject | ParsedCommitObject | ParsedTreeObject | ParsedTagObject} ParsedObject
 */

/**
 *
 * @typedef {DeflatedObject | WrappedObject | RawObject | ParsedObject } ReadObjectResult
 */

/**
 * Read a git object directly by its SHA-1 object id
 *
 * Regarding `ReadObjectResult`:
 *
 * - `oid` will be the same as the `oid` argument unless the `filepath` argument is provided, in which case it will be the oid of the tree or blob being returned.
 * - `type` of deflated objects is `'deflated'`, and `type` of wrapped objects is `'wrapped'`
 * - `format` is usually, but not always, the format you requested. Packfiles do not store each object individually compressed so if you end up reading the object from a packfile it will be returned in format 'content' even if you requested 'deflated' or 'wrapped'.
 * - `object` will be an actual Object if format is 'parsed' and the object is a commit, tree, or annotated tag. Blobs are still formatted as Buffers unless an encoding is provided in which case they'll be strings. If format is anything other than 'parsed', object will be a Buffer.
 * - `source` is the name of the packfile or loose object file where the object was found.
 *
 * The `format` parameter can have the following values:
 *
 * | param      | description                                                                                                                                                                                               |
 * | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
 * | 'deflated' | Return the raw deflate-compressed buffer for an object if possible. Useful for efficiently shuffling around loose objects when you don't care about the contents and can save time by not inflating them. |
 * | 'wrapped'  | Return the inflated object buffer wrapped in the git object header if possible. This is the raw data used when calculating the SHA-1 object id of a git object.                                           |
 * | 'content'  | Return the object buffer without the git header.                                                                                                                                                          |
 * | 'parsed'   | Returns a parsed representation of the object.                                                                                                                                                            |
 *
 * The result will be in one of the following schemas:
 *
 * ## `'deflated'` format
 *
 * {@link DeflatedObject typedef}
 *
 * ## `'wrapped'` format
 *
 * {@link WrappedObject typedef}
 *
 * ## `'content'` format
 *
 * {@link RawObject typedef}
 *
 * ## `'parsed'` format
 *
 * ### parsed `'blob'` type
 *
 * {@link ParsedBlobObject typedef}
 *
 * ### parsed `'commit'` type
 *
 * {@link ParsedCommitObject typedef}
 * {@link CommitObject typedef}
 *
 * ### parsed `'tree'` type
 *
 * {@link ParsedTreeObject typedef}
 * {@link TreeObject typedef}
 *
 * ### parsed `'tag'` type
 *
 * {@link ParsedTagObject typedef}
 * {@link TagObject typedef}
 *
 * @deprecated
 * > **Deprecated**
 * > This command is overly complicated.
 * >
 * > If you know the type of object you are reading, use [`readBlob`](./readBlob.md), [`readCommit`](./readCommit.md), [`readTag`](./readTag.md), or [`readTree`](./readTree.md).
 *
 * @param {object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.oid - The SHA-1 object id to get
 * @param {'deflated' | 'wrapped' | 'content' | 'parsed'} [args.format = 'parsed'] - What format to return the object in. The choices are described in more detail below.
 * @param {string} [args.filepath] - Don't return the object with `oid` itself, but resolve `oid` to a tree and then return the object at that filepath. To return the root directory of a tree set filepath to `''`
 * @param {string} [args.encoding] - A convenience argument that only affects blobs. Instead of returning `object` as a buffer, it returns a string parsed using the given encoding.
 *
 * @returns {Promise<ReadObjectResult>} Resolves successfully with a git object description
 * @see ReadObjectResult
 *
 * @example
 * // Get the contents of 'README.md' in the master branch.
 * let sha = await git.resolveRef({ dir: '$input((/))', ref: '$input((master))' })
 * console.log(sha)
 * let { object: blob } = await git.readObject({
 *   dir: '$input((/))',
 *   oid: $input((sha)),
 *   $textarea((filepath: 'README.md',
 *   encoding: 'utf8'))
 * })
 * console.log(blob)
 *
 * @example
 * // Find all the .js files in the current master branch containing the word 'commit'
 * let sha = await git.resolveRef({ dir: '$input((/))', ref: '$input((master))' })
 * console.log(sha)
 * let { object: commit } = await git.readObject({ dir: '$input((/))', oid: sha })
 * console.log(commit)
 *
 * const searchTree = async ({oid, prefix = ''}) => {
 *   let { object: tree } = await git.readObject({ dir: '$input((/))', oid })
 *   for (let entry of tree) {
 *     if (entry.type === 'tree') {
 *       await searchTree({oid: entry.oid, prefix: `${prefix}/${entry.path}`})
 *     } else if (entry.type === 'blob') {
 *       if ($input((entry.path.endsWith('.js')))) {
 *         let { object: blob } = await git.readObject({ dir: '$input((/))', oid: entry.oid })
 *         if ($input((blob.toString('utf8').includes('commit')))) {
 *           console.log(`${prefix}/${entry.path}`)
 *         }
 *       }
 *     }
 *   }
 * }
 *
 * await searchTree({oid: commit.tree})
 * console.log('done')
 *
 */
export async function readObject ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  oid,
  format = 'parsed',
  filepath = undefined,
  encoding = undefined
}) {
  try {
    const fs = new FileSystem(cores.get(core).get('fs'))
    if (filepath !== undefined) {
      // Ensure there are no leading or trailing directory separators.
      // I was going to do this automatically, but then found that the Git Terminal for Windows
      // auto-expands --filepath=/src/utils to --filepath=C:/Users/Will/AppData/Local/Programs/Git/src/utils
      // so I figured it would be wise to promote the behavior in the application layer not just the library layer.
      if (filepath.startsWith('/') || filepath.endsWith('/')) {
        throw new GitError(E.DirectorySeparatorsError)
      }
      const _oid = oid
      const result = await resolveTree({ fs, gitdir, oid })
      const tree = result.tree
      if (filepath === '') {
        oid = result.oid
      } else {
        const pathArray = filepath.split('/')
        oid = await resolveFile({
          fs,
          gitdir,
          tree,
          pathArray,
          oid: _oid,
          filepath
        })
      }
    }
    // GitObjectManager does not know how to parse content, so we tweak that parameter before passing it.
    const _format = format === 'parsed' ? 'content' : format
    const result = await _readObject({
      fs,
      gitdir,
      oid,
      format: _format
    })
    result.oid = oid
    if (format === 'parsed') {
      result.format = 'parsed'
      switch (result.type) {
        case 'commit':
          result.object = GitCommit.from(result.object).parse()
          break
        case 'tree':
          result.object = { entries: GitTree.from(result.object).entries() }
          break
        case 'blob':
          // Here we consider returning a raw Buffer as the 'content' format
          // and returning a string as the 'parsed' format
          if (encoding) {
            result.object = result.object.toString(encoding)
          } else {
            result.object = new Uint8Array(result.object)
            result.format = 'content'
          }
          break
        case 'tag':
          result.object = GitAnnotatedTag.from(result.object).parse()
          break
        default:
          throw new GitError(E.ObjectTypeUnknownFail, { type: result.type })
      }
    } else if (result.format === 'deflated' || result.format === 'wrapped') {
      result.type = result.format
    }
    return result
  } catch (err) {
    err.caller = 'git.readObject'
    throw err
  }
}

async function resolveFile ({ fs, gitdir, tree, pathArray, oid, filepath }) {
  const name = pathArray.shift()
  for (const entry of tree) {
    if (entry.path === name) {
      if (pathArray.length === 0) {
        return entry.oid
      } else {
        const { type, object } = await _readObject({
          fs,
          gitdir,
          oid: entry.oid
        })
        if (type === 'blob') {
          throw new GitError(E.DirectoryIsAFileError, { oid, filepath })
        }
        if (type !== 'tree') {
          throw new GitError(E.ObjectTypeAssertionInTreeFail, {
            oid: entry.oid,
            entrypath: filepath,
            type
          })
        }
        tree = GitTree.from(object)
        return resolveFile({ fs, gitdir, tree, pathArray, oid, filepath })
      }
    }
  }
  throw new GitError(E.TreeOrBlobNotFoundError, { oid, filepath })
}
