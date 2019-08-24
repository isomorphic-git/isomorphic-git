// @ts-check
import { FileSystem } from '../models/FileSystem.js'
import { GitCommit } from '../models/GitCommit.js'
import { readObject } from '../storage/readObject.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'

/**
 * Find the merge base for a set of commits
 *
 * @link https://isomorphic-git.github.io/docs/findMergeBase.html
 */
// TODO: Should I rename this nearestCommonAncestor?
export async function findMergeBase ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  oids
}) {
  // Note: right now, the tests are geared so that the output should match that of
  // `git merge-base --all --octopus`
  // because without the --octopus flag, git's output seems to depend on the ORDER of the oids,
  // and computing virtual merge bases is just too much for me to fathom right now.
  try {
    const fs = new FileSystem(_fs)
    // If we start N independent walkers, one at each of the given `oids`, and walk backwards
    // through ancestors, eventually we'll discover a commit where each one of these N walkers
    // has passed through. So we just need to keep track of which walkers have visited each commit
    // until we find a commit that N distinct walkers has visited.
    const visits = {}
    const passes = oids.length
    let heads = oids.map((oid, index) => ({index, oid}))
    while (heads.length) {
      // Count how many times we've passed each commit
      const result = new Set()
      for (const { oid, index } of heads) {
        if (!visits[oid]) visits[oid] = new Set()
        visits[oid].add(index)
        if (visits[oid].size === passes) {
          result.add(oid)
        }
      }
      if (result.size > 0) {
        return [...result]
      }
      // We haven't found a common ancestor yet
      const newheads = []
      for (const { oid, index } of heads) {
        try {
          const { object } = await readObject({ fs, gitdir, oid })
          const commit = GitCommit.from(object)
          const { parent } = commit.parseHeaders()
          for (const oid of parent) {
            newheads.push({ oid, index })
          }
        } catch (err) {
          // do nothing
        }
      }
      heads = newheads
    }
    return []
  } catch (err) {
    err.caller = 'git.findMergeBase'
    throw err
  }
}
