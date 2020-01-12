// @ts-check
import { FileSystem } from '../models/FileSystem.js'
import { GitAnnotatedTag } from '../models/GitAnnotatedTag.js'
import { E, GitError } from '../models/GitError.js'
import { readObject } from '../storage/readObject.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'

/**
 *
 * @typedef {Object} ReadTagResult - The object returned has the following schema:
 * @property {string} oid - SHA-1 object id of this tag
 * @property {TagObject} tag - the parsed tag object
 * @property {string} payload - PGP signing payload
 */

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
 * Read an annotated tag object directly
 *
 * @param {object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {FileSystem} [args.fs] - [deprecated] The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.oid - The SHA-1 object id to get
 *
 * @returns {Promise<ReadTagResult>} Resolves successfully with a git object description
 * @see ReadTagResult
 * @see TagObject
 *
 */
export async function readTag ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  oid
}) {
  try {
    const fs = new FileSystem(_fs)
    const { type, object } = await readObject({
      fs,
      gitdir,
      oid,
      format: 'content'
    })
    if (type !== 'tag') {
      throw new GitError(E.ObjectTypeAssertionFail, {
        oid,
        type,
        expected: 'tag'
      })
    }
    const tag = GitAnnotatedTag.from(object)
    const result = {
      oid,
      tag: tag.parse(),
      payload: tag.payload()
    }
    // @ts-ignore
    return result
  } catch (err) {
    err.caller = 'git.readTag'
    throw err
  }
}
