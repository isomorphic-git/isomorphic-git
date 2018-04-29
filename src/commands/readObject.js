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
  format = 'parsed'
}) {
  const fs = new FileSystem(_fs)
  // GitObjectManager does not know how to parse content, so we tweak that parameter before passing it.
  const _format = format === 'parsed' ? 'content' : format
  let result = await GitObjectManager.read({ fs, gitdir, oid, format: _format })
  if (format === 'parsed') {
    switch (result.type) {
      case 'commit':
        result.object = GitCommit.from(result.object).parse()
        break
      case 'tree':
        result.object = { entries: GitTree.from(result.object).entries() }
        break
      case 'blob':
        break
      case 'tag':
        throw new Error(
          'TODO: Parsing annotated tag objects still needs to be implemented!!'
        )
      default:
        throw new Error(`Unrecognized git object type: '${result.type}'`)
    }
    result.format = 'parsed'
  }
  return result
}
