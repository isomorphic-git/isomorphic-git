// @ts-check
import { ObjectTypeError } from '../errors/ObjectTypeError.js'
import { GitShallowManager } from '../managers/GitShallowManager.js'
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
  // through ancestors, eventually we'll discover commits where each one of these N walkers
  // has passed through. We cannot stop at the first common commit because a better common
  // ancestor may still be present in another branch of the graph.
  const visits = {}
  const passes = oids.length
  const common = new Set()
  const parents = new Map()
  const shallows = await GitShallowManager.read({ fs, gitdir })
  const readParents = async oid => {
    if (parents.has(oid)) return parents.get(oid)
    const { object, type } = await readObject({ fs, cache, gitdir, oid })
    if (type !== 'commit') {
      throw new ObjectTypeError(oid, type, 'commit')
    }
    const commit = GitCommit.from(object)
    const { parent } = commit.parseHeaders()
    const result = shallows.has(oid) ? [] : parent
    parents.set(oid, result)
    return result
  }
  let heads = oids.map((oid, index) => ({ index, oid }))
  while (heads.length) {
    // Count how many times we've passed each commit
    for (const { oid, index } of heads) {
      await readParents(oid)
      if (!visits[oid]) visits[oid] = new Set()
      visits[oid].add(index)
      if (visits[oid].size === passes) {
        common.add(oid)
      }
    }
    const newheads = new Map()
    for (const { oid, index } of heads) {
      // Parents of a common commit cannot be better merge bases.
      if (common.has(oid)) continue
      for (const parent of await readParents(oid)) {
        if (!visits[parent] || !visits[parent].has(index)) {
          newheads.set(parent + ':' + index, { oid: parent, index })
        }
      }
    }
    heads = Array.from(newheads.values())
  }

  if (common.size < 2) return [...common]

  // A merge base is only "best" when it is not an ancestor of another
  // common ancestor. This also keeps independent criss-cross bases.
  const redundant = new Set()
  for (const oid of common) {
    const ancestors = [...(await readParents(oid))]
    const seen = new Set()
    while (ancestors.length) {
      const ancestor = ancestors.pop()
      if (seen.has(ancestor)) continue
      seen.add(ancestor)
      if (common.has(ancestor)) {
        redundant.add(ancestor)
      } else {
        ancestors.push(...(await readParents(ancestor)))
      }
    }
  }
  return [...common].filter(oid => !redundant.has(oid))
}
