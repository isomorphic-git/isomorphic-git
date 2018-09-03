import path from 'path'

import { FileSystem } from '../models/FileSystem.js'
import { GitAnnotatedTag } from '../models/GitAnnotatedTag.js'
import { GitCommit } from '../models/GitCommit.js'
import { E, GitError } from '../models/GitError.js'
import { GitTree } from '../models/GitTree.js'
import { readObject as _readObject } from '../storage/readObject.js'
import { cores } from '../utils/plugins.js'
import { resolveTree } from '../utils/resolveTree.js'

/**
 * Read a git object directly by its SHA1 object id
 *
 * @link https://isomorphic-git.github.io/docs/readObject.html
 */
export async function readObject ({
  core = 'default',
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  oid,
  format = 'parsed',
  filepath = undefined,
  encoding = undefined
}) {
  try {
    const fs = new FileSystem(_fs)
    if (filepath !== undefined) {
      // Ensure there are no leading or trailing directory separators.
      // I was going to do this automatically, but then found that the Git Terminal for Windows
      // auto-expands --filepath=/src/utils to --filepath=C:/Users/Will/AppData/Local/Programs/Git/src/utils
      // so I figured it would be wise to promote the behavior in the application layer not just the library layer.
      if (filepath.startsWith('/') || filepath.endsWith('/')) {
        throw new GitError(E.DirectorySeparatorsError)
      }
      const _oid = oid
      let result = await resolveTree({ fs, gitdir, oid })
      let tree = result.tree
      if (filepath === '') {
        oid = result.oid
      } else {
        let pathArray = filepath.split('/')
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
    let result = await _readObject({
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
            result.format = 'content'
          }
          break
        case 'tag':
          result.object = GitAnnotatedTag.from(result.object).parse()
          break
        default:
          throw new GitError(E.ObjectTypeUnknownFail, { type: result.type })
      }
    }
    return result
  } catch (err) {
    err.caller = 'git.readObject'
    throw err
  }
}

async function resolveFile ({ fs, gitdir, tree, pathArray, oid, filepath }) {
  let name = pathArray.shift()
  for (let entry of tree) {
    if (entry.path === name) {
      if (pathArray.length === 0) {
        return entry.oid
      } else {
        let { type, object } = await _readObject({
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
