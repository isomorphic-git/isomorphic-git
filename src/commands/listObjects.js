import path from 'path'

import { GitObjectManager } from '../managers/GitObjectManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { GitCommit } from '../models/GitCommit.js'
import { GitTree } from '../models/GitTree.js'

export async function listObjects ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  oids
}) {
  const fs = new FileSystem(_fs)
  let visited = new Set()
  // We don't do the purest simplest recursion, because we can
  // avoid reading Blob objects entirely since the Tree objects
  // tell us which oids are Blobs and which are Trees.
  async function walk (oid) {
    visited.add(oid)
    let { type, object } = await GitObjectManager.read({ fs, gitdir, oid })
    if (type === 'commit') {
      let commit = GitCommit.from(object)
      let tree = commit.headers().tree
      await walk(tree)
    } else if (type === 'tree') {
      let tree = GitTree.from(object)
      for (let entry of tree) {
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
