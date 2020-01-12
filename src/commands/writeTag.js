// @ts-check
import { FileSystem } from '../models/FileSystem.js'
import { GitAnnotatedTag } from '../models/GitAnnotatedTag.js'
import { writeObject } from '../storage/writeObject.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'

/**
 *
 * @typedef {Object} TagObject
 * @property {string} object - SHA-1 object id of object being tagged
 * @property {'blob' | 'tree' | 'commit' | 'tag'} type - the type of the object being tagged
 * @property {string} tag - the tag name
 * @property {Object} tagger
 * @property {string} tagger.name - the tagger's name
 * @property {string} tagger.email - the tagger's email
 * @property {number} tagger.timestamp - UTC Unix timestamp in seconds
 * @property {number} tagger.timezoneOffset - timezone difference from UTC in minutes
 * @property {string} message - tag message
 * @property {string} [signature] - PGP signature (if present)
 */

/**
 * Write an annotated tag object directly
 *
 * @param {object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {FileSystem} [args.fs] - [deprecated] The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {TagObject} args.tag - The object to write
 *
 * @returns {Promise<string>} Resolves successfully with the SHA-1 object id of the newly written object
 * @see TagObject
 *
 * @example
 * // Manually create an annotated tag.
 * let sha = await git.resolveRef({ dir: '$input((/))', ref: '$input((HEAD))' })
 * console.log('commit', sha)
 *
 * let oid = await git.writeTag({
 *   dir: '$input((/))',
 *   tag: {
 *     object: sha,
 *     type: 'commit',
 *     tag: '$input((my-tag))',
 *     tagger: {
 *       name: '$input((your name))',
 *       email: '$input((email@example.com))',
 *       timestamp: Math.floor(Date.now()/1000),
 *       timezoneOffset: new Date().getTimezoneOffset()
 *     },
 *     message: '$input((Optional message))'
 *   }
 * })
 *
 * console.log('tag', oid)
 *
 */
export async function writeTag ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  tag
}) {
  try {
    const fs = new FileSystem(_fs)
    // Convert object to buffer
    const object = GitAnnotatedTag.from(tag).toObject()
    const oid = await writeObject({
      fs,
      gitdir,
      type: 'tag',
      object,
      format: 'content'
    })
    return oid
  } catch (err) {
    err.caller = 'git.writeTag'
    throw err
  }
}
