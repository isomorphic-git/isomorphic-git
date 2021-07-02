// @ts-check
import { GitTree } from '../models/GitTree.js'
import { _readObject as readObject } from '../storage/readObject.js'

import { join } from './join.js'
import { resolveTree } from './resolveTree.js'

// the empty file content object id
const EMPTY_OID = 'e69de29bb2d1d6434b8b29ae775ad8c2e48c5391'

export async function resolveFileIdInTree({ fs, cache, gitdir, oid, fileId }) {
  if (fileId === EMPTY_OID) return
  const _oid = oid
  let filepath
  const result = await resolveTree({ fs, cache, gitdir, oid })
  const tree = result.tree
  if (fileId === result.oid) {
    filepath = result.path
  } else {
    filepath = await _resolveFileId({
      fs,
      cache,
      gitdir,
      tree,
      fileId,
      oid: _oid,
    })
    if (Array.isArray(filepath)) {
      if (filepath.length === 0) filepath = undefined
      else if (filepath.length === 1) filepath = filepath[0]
    }
  }
  return filepath
}

async function _resolveFileId({
  fs,
  cache,
  gitdir,
  tree,
  fileId,
  oid,
  filepaths = [],
  parentPath = '',
}) {
  const walks = tree.entries().map(function(entry) {
    let result
    if (entry.oid === fileId) {
      result = join(parentPath, entry.path)
      filepaths.push(result)
    } else if (entry.type === 'tree') {
      result = readObject({
        fs,
        cache,
        gitdir,
        oid: entry.oid,
      }).then(function({ object }) {
        return _resolveFileId({
          fs,
          cache,
          gitdir,
          tree: GitTree.from(object),
          fileId,
          oid,
          filepaths,
          parentPath: join(parentPath, entry.path),
        })
      })
    }
    return result
  })

  await Promise.all(walks)
  return filepaths
}
