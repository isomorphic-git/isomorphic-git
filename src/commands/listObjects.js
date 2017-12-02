// @flow
import { GitObjectManager } from '../managers'
import { GitCommit, GitTree } from '../models'
import { fs as defaultfs, setfs } from '../utils'

export async function listObjects (
  { gitdir, fs = defaultfs() },
  { oids } /*: {
  gitdir: string,
  oids: Array<string>
} */
) {
  setfs(fs)
  let visited /*: Set<string> */ = new Set()

  // We don't do the purest simplest recursion, because we can
  // avoid reading Blob objects entirely since the Tree objects
  // tell us which oids are Blobs and which are Trees.
  async function walk (oid) {
    visited.add(oid)
    let { type, object } = await GitObjectManager.read({ gitdir, oid })
    if (type === 'commit') {
      let commit = GitCommit.from(object)
      let tree = commit.headers().tree
      await walk(tree)
    } else if (type === 'tree') {
      let tree = GitTree.from(object)
      for (let entry /*: TreeEntry */ of tree) {
        visited.add(entry.oid)
        // only recurse for trees
        if (entry.type === 'tree') {
          await walk(entry.oid)
        }
      }
    }
  }

  // Let's go walking!
  for (let oid of oids) {
    await walk(oid)
  }
  return visited
}
