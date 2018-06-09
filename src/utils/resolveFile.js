import { GitObjectManager } from '../managers'
import { GitTree } from '../models'

export async function resolveFile ({ fs, gitdir, tree, pathArray }) {
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
