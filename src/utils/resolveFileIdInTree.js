// @ts-check
import { GitTree } from '../models/GitTree.js'
import { _readObject as readObject } from '../storage/readObject.js'

import { join } from './join.js'
import { resolveTree } from './resolveTree.js'

export async function resolveFileIdInTree({ fs, gitdir, oid, fileId }) {
  const _oid = oid
  let filepath
  const result = await resolveTree({ fs, gitdir, oid })
  const tree = result.tree
  if (fileId === result.oid) {
    filepath = result.path
  } else {
    filepath = await _resolveFileId({
      fs,
      gitdir,
      tree,
      fileId,
      oid: _oid,
    })
  }
  return filepath
}

async function _resolveFileId({
  fs,
  gitdir,
  tree,
  fileId,
  oid,
  filepath = '',
}) {
  for (const entry of tree) {
    if (entry.oid === fileId) {
      return join(filepath, entry.path)
    } else if (entry.type === 'tree') {
      const { object } = await readObject({
        fs,
        gitdir,
        oid: entry.oid,
      })
      const result = await _resolveFileId({
        fs,
        gitdir,
        tree: GitTree.from(object),
        fileId,
        oid,
        filepath: join(filepath, entry.path),
      })
      if (result) return result
    }
  }
  // throw new NotFoundError(`file or directory found at "${oid}:${filepath}"`)
}
