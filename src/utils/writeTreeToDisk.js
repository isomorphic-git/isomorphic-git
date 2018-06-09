import path from 'path'

import { GitObjectManager } from '../managers'
import { FileSystem, GitTree } from '../models'

export async function writeTreeToDisk ({
  fs: _fs,
  dir,
  gitdir,
  index,
  prefix,
  tree
}) {
  const fs = new FileSystem(_fs)
  for (let entry of tree) {
    let { type, object } = await GitObjectManager.read({
      fs,
      gitdir,
      oid: entry.oid
    })
    let entrypath = prefix === '' ? entry.path : `${prefix}/${entry.path}`
    let filepath = path.join(dir, prefix, entry.path)
    switch (type) {
      case 'blob':
        await fs.write(filepath, object)
        let stats = await fs._lstat(filepath)
        index.insert({
          filepath: entrypath,
          stats,
          oid: entry.oid
        })
        break
      case 'tree':
        let tree = GitTree.from(object)
        await writeTreeToDisk({
          fs,
          dir,
          gitdir,
          index,
          prefix: entrypath,
          tree
        })
        break
      default:
        throw new Error(
          `Unexpected object type ${type} found in tree for '${entrypath}'`
        )
    }
  }
}
