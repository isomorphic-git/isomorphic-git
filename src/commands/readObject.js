import path from 'path'

import { GitObjectManager } from '../managers'
import { FileSystem, GitCommit, GitTree } from '../models'

/**
 * Read a git object directly by its SHA1 object id
 *
 * @link https://isomorphic-git.github.io/docs/readObject.html
 */
export async function readObject ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  oid,
  format = 'parsed',
  filepath = undefined,
  encoding = undefined
}) {
  const fs = new FileSystem(_fs)
  if (filepath !== undefined) {
    // Ensure there are no leading or trailing directory separators.
    // I was going to do this automatically, but then found that the Git Terminal for Windows
    // auto-expands --filepath=/src/utils to --filepath=C:/Users/Will/AppData/Local/Programs/Git/src/utils
    // so I figured it would be wise to promote the behavior in the application layer not just the library layer.
    if (filepath.startsWith('/') || filepath.endsWith('/')) {
      throw new Error(
        `'filepath' parameter should not include leading or trailing directory separators because these can cause problems on some platforms`
      )
    }
    const _oid = oid
    let result
    let tree
    try {
      result = await resolveTree({ fs, gitdir, oid })
      tree = result.tree
    } catch (err) {
      throw new Error(`Could not resolve ${oid} to a tree.`)
    }
    try {
      if (filepath === '') {
        oid = result.oid
      } else {
        let pathArray = filepath.split('/')
        oid = await resolveFile({ fs, gitdir, tree, pathArray })
      }
    } catch (err) {
      if (err.message === 'Unexpected blob') {
        throw new Error(
          `Unable to read '${_oid}:${filepath}' because encountered a file where a directory was expected.`
        )
      } else if (err.message === 'No match path') {
        throw new Error(`No file or directory found at '${_oid}:${filepath}'.`)
      } else {
        throw err
      }
    }
  }
  // GitObjectManager does not know how to parse content, so we tweak that parameter before passing it.
  const _format = format === 'parsed' ? 'content' : format
  let result = await GitObjectManager.read({ fs, gitdir, oid, format: _format })
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
        throw new Error(
          'readObject.js:34 E28 TODO: Parsing annotated tag objects still needs to be implemented!!'
        )
      default:
        throw new Error(`readObject.js:37 E29 Unrecognized git object type: '${result.type}'`)
    }
  }
  return result
}

async function resolveTree ({ fs, gitdir, oid }) {
  let { type, object } = await GitObjectManager.read({ fs, gitdir, oid })
  // Resolve commits to trees
  if (type === 'commit') {
    oid = GitCommit.from(object).parse().tree
    let result = await GitObjectManager.read({ fs, gitdir, oid })
    type = result.type
    object = result.object
  }
  if (type !== 'tree') {
    throw new Error(`Could not resolve ${oid} to a tree`)
  }
  return { tree: GitTree.from(object), oid }
}

async function resolveFile ({ fs, gitdir, tree, pathArray }) {
  let name = pathArray.shift()
  for (let entry of tree) {
    if (entry.path === name) {
      if (pathArray.length === 0) {
        return entry.oid
      } else {
        let { type, object } = await GitObjectManager.read({
          fs,
          gitdir,
          oid: entry.oid
        })
        if (type === 'blob') throw new Error(`Unexpected blob`)
        if (type !== 'tree') {
          throw new Error(`Could not resolve ${entry.oid} to a tree`)
        }
        tree = GitTree.from(object)
        return resolveFile({ fs, gitdir, tree, pathArray })
      }
    }
  }
  throw new Error(`No match path`)
}
