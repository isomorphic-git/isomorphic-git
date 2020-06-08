import { GitAnnotatedTag } from '../models/GitAnnotatedTag.js'
import { GitCommit } from '../models/GitCommit.js'
import { GitTree } from '../models/GitTree.js'
import { _readObject as readObject } from '../storage/readObject.js'
import { join } from '../utils/join.js'

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string} [args.dir]
 * @param {string} args.gitdir
 * @param {Iterable<string>} args.oids
 * @returns {Promise<Set<string>>}
 */
export async function listObjects({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  oids,
}) {
  const visited = new Set()
  // We don't do the purest simplest recursion, because we can
  // avoid reading Blob objects entirely since the Tree objects
  // tell us which oids are Blobs and which are Trees.
  async function walk(oid) {
    if (visited.has(oid)) return
    visited.add(oid)
    const { type, object } = await readObject({ fs, gitdir, oid })
    if (type === 'tag') {
      const tag = GitAnnotatedTag.from(object)
      const obj = tag.headers().object
      await walk(obj)
    } else if (type === 'commit') {
      const commit = GitCommit.from(object)
      const tree = commit.headers().tree
      await walk(tree)
    } else if (type === 'tree') {
      const tree = GitTree.from(object)
      for (const entry of tree) {
        // add blobs and submodules to the visited set
        if (entry.type === 'blob' || entry.type === 'commit') {
          visited.add(entry.oid)
        }
        // recurse for trees
        if (entry.type === 'tree') {
          await walk(entry.oid)
        }
      }
    }
  }
  // Let's go walking!
  for (const oid of oids) {
    await walk(oid)
  }
  return visited
}
