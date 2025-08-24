// @ts-check
import { GitCommit } from '../models/GitCommit.js'
import { _readObject as readObject } from '../storage/readObject.js'

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {any} args.cache
 * @param {string} args.gitdir
 * @param {string[]} args.oids
 *
 */
export async function _findMergeBase({ fs, cache, gitdir, oids }) {
  // Note: right now, the tests are geared so that the output should match that of
  // `git merge-base --all --octopus`
  // because without the --octopus flag, git's output seems to depend on the ORDER of the oids,
  // and computing virtual merge bases is just too much for me to fathom right now.

  // If we start N independent walkers, one at each of the given `oids`, and walk backwards
  // through ancestors, eventually we'll discover a commit where each one of these N walkers
  // has passed through. So we just need to keep track of which walkers have visited each commit
  // until we find a commit that N distinct walkers has visited.
  const visits = {}
  const passes = oids.length
  let heads = oids.map((oid, index) => ({ index, oid }))
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
    const newheads = new Map()
    for (const { oid, index } of heads) {
      try {
        const { object } = await readObject({ fs, cache, gitdir, oid })
        const commit = GitCommit.from(object)
        const { parent } = commit.parseHeaders()
        for (const oid of parent) {
          if (!visits[oid] || !visits[oid].has(index)) {
            newheads.set(oid + ':' + index, { oid, index })
          }
        }
      } catch (err) {
        // do nothing
      }
    }
    heads = Array.from(newheads.values())
  }
  return []
}
