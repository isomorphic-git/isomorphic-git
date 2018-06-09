import { GitObjectManager } from '../managers'
import { GitTree } from '../models'

export async function constructTree ({ fs, gitdir, inode }) {
  // use depth first traversal
  let children = inode.children
  for (let inode of children) {
    if (inode.type === 'tree') {
      inode.metadata.mode = '040000'
      inode.metadata.oid = await constructTree({ fs, gitdir, inode })
    }
  }
  let entries = children.map(inode => ({
    mode: inode.metadata.mode,
    path: inode.basename,
    oid: inode.metadata.oid,
    type: inode.type
  }))
  const tree = GitTree.from(entries)
  let oid = await GitObjectManager.write({
    fs,
    gitdir,
    type: 'tree',
    object: tree.toObject()
  })
  return oid
}
