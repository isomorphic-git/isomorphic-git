// @ts-check
import { E, GitError } from '../models/GitError.js'
import { GitTree } from '../models/GitTree.js'
import { readObject } from '../storage/readObject.js'
import { resolveTree } from '../utils/resolveTree.js'

export async function resolveFilepath ({ fs, gitdir, oid, filepath }) {
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
    oid = await _resolveFilepath({
      fs,
      gitdir,
      tree,
      pathArray,
      oid: _oid,
      filepath
    })
  }
  return oid
}

async function _resolveFilepath ({
  fs,
  gitdir,
  tree,
  pathArray,
  oid,
  filepath
}) {
  const name = pathArray.shift()
  for (const entry of tree) {
    if (entry.path === name) {
      if (pathArray.length === 0) {
        return entry.oid
      } else {
        const { type, object } = await readObject({
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
        return _resolveFilepath({ fs, gitdir, tree, pathArray, oid, filepath })
      }
    }
  }
  throw new GitError(E.TreeOrBlobNotFoundError, { oid, filepath })
}
