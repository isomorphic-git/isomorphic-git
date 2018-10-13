import path from 'path'

import { FileSystem } from '../models/FileSystem.js'
import { GitAnnotatedTag } from '../models/GitAnnotatedTag.js'
import { GitCommit } from '../models/GitCommit.js'
import { GitTree } from '../models/GitTree.js'
import { readObject } from '../storage/readObject.js'
import { cores } from '../utils/plugins.js'

export async function listObjects ({
  core = 'default',
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  oids
}) {
  const fs = new FileSystem(_fs)
  let visited = new Set()
  // We don't do the purest simplest recursion, because we can
  // avoid reading Blob objects entirely since the Tree objects
  // tell us which oids are Blobs and which are Trees.
  async function walk (oid) {
    visited.add(oid)
    let { type, object } = await readObject({ fs, gitdir, oid })
    if (type === 'tag') {
      let tag = GitAnnotatedTag.from(object)
      let obj = tag.headers().object
      await walk(obj)
    } else if (type === 'commit') {
      let commit = GitCommit.from(object)
      let tree = commit.headers().tree
      await walk(tree)
    } else if (type === 'tree') {
      let tree = GitTree.from(object)
      for (let entry of tree) {
        // only add blobs and trees to the set,
        // skipping over submodules whose type is 'commit'
        if (entry.type === 'blob' || entry.type === 'tree') {
          visited.add(entry.oid)
        }
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
