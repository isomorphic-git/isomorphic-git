import path from 'path'

import { FileSystem } from '../models/FileSystem.js'
import { GitCommit } from '../models/GitCommit.js'
import { readObject } from '../storage/readObject.js'
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
  gitdir = path.join(dir, '.git'),
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
    // has passed through. So we just need to keep tallies until we find one where we've walked
    // through N times.
    // TODO: I think it would be much safer if we actually tracked the identities of the walkers
    // rather than the sum.
    const counts = {}
    let passes = oids.length
    let heads = oids
    while (heads.length) {
      // Count how many times we've passed each commit
      let result = []
      for (let oid of heads) {
        if (counts[oid]) {
          counts[oid] += 1
        } else {
          counts[oid] = 1
        }
        if (counts[oid] === passes) {
          result.push(oid)
        }
      }
      if (result.length > 0) {
        return result
      }
      // We haven't found a common ancestor yet
      let newheads = []
      for (let oid of heads) {
        try {
          let { object } = await readObject({ fs, gitdir, oid })
          let commit = GitCommit.from(object)
          let { parent } = commit.parseHeaders()
          for (let oid of parent) {
            newheads.push(oid)
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
