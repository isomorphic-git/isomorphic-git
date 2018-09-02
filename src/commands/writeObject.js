import path from 'path'

import { FileSystem } from '../models/FileSystem.js'
import { GitAnnotatedTag } from '../models/GitAnnotatedTag.js'
import { GitCommit } from '../models/GitCommit.js'
import { E, GitError } from '../models/GitError.js'
import { GitTree } from '../models/GitTree.js'
import { writeObject as _writeObject } from '../storage/writeObject.js'
import { cores } from '../utils/plugins.js'

/**
 * Write a git object directly to a repository
 *
 * @link https://isomorphic-git.github.io/docs/writeObject.html
 */
export async function writeObject ({
  core = 'default',
  dir,
  gitdir = path.join(dir, '.git'),
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
