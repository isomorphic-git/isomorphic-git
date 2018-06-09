import { GitObjectManager } from '../managers'
import { GitTree } from '../models'

export async function getOidAtPath ({ fs, gitdir, tree, path }) {
  if (typeof path === 'string') path = path.split('/')
  let dirname = path.shift()
  for (let entry of tree) {
    if (entry.path === dirname) {
      if (path.length === 0) {
        return entry.oid
      }
      let { type, object } = await GitObjectManager.read({
        fs,
        gitdir,
        oid: entry.oid
      })
      if (type === 'tree') {
        let tree = GitTree.from(object)
        return getOidAtPath({ fs, gitdir, tree, path })
      }
      if (type === 'blob') {
        throw new Error(`Blob found where tree expected.`)
      }
    }
  }
  return null
}
