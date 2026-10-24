import { ObjectTypeError } from '../errors/ObjectTypeError.js'
import { GitRefManager } from '../managers/GitRefManager.js'
import { GitShallowManager } from '../managers/GitShallowManager.js'
import { GitAnnotatedTag } from '../models/GitAnnotatedTag.js'
import { GitCommit } from '../models/GitCommit.js'
import { _readObject as readObject } from '../storage/readObject.js'
import { join } from '../utils/join.js'

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {any} args.cache
 * @param {string} [args.dir]
 * @param {string} args.gitdir
 * @param {Iterable<string>} args.start
 * @param {Iterable<string>} args.finish
 * @returns {Promise<Set<string>>}
 */
export async function listCommitsAndTags({
  fs,
  cache,
  dir,
  gitdir = join(dir, '.git'),
  start,
  finish,
}) {
  const shallows = await GitShallowManager.read({ fs, gitdir })
  const startingSet = new Set()
  const finishingSet = new Set()
  for (const ref of start) {
    startingSet.add(await GitRefManager.resolve({ fs, gitdir, ref }))
  }
  for (const ref of finish) {
    // We may not have these refs locally so we must try/catch
    try {
      const oid = await GitRefManager.resolve({ fs, gitdir, ref })
      finishingSet.add(oid)
    } catch (err) {}
  }
  // The remote has everything reachable from `finish`, not just `finish`
  // itself, so stopping only at those commits walks to the root after a
  // merge. Like `git rev-list start --not finish`, walk both sides newest
  // first and stop once only commits reachable from `finish` are left.
  // Clock skew can make us send too much, never too little.
  const visited = new Set()
  const uninteresting = new Set()
  // Commits whose parents are still to be walked, newest first
  const queue = []
  // Because git commits are named by their hash, there is no
  // way to construct a cycle. Therefore we won't worry about
  // setting a default recursion limit.
  /**
   * Reads `oid`, peeling annotated tags, marks the commit as visited or
   * uninteresting, and queues its parents to be walked.
   *
   * @param {string} oid
   * @param {boolean} [isUninteresting] - true if the remote has this commit
   * @returns {Promise<void>}
   */
  async function walk(oid, isUninteresting = false) {
    if (uninteresting.has(oid)) return
    if (!isUninteresting && visited.has(oid)) return
    let result
    try {
      result = await readObject({ fs, cache, gitdir, oid })
    } catch (err) {
      // We may not have the commits the remote advertises
      if (isUninteresting) return
      throw err
    }
    const { type, object } = result
    ;(isUninteresting ? uninteresting : visited).add(oid)
    // Recursively resolve annotated tags
    if (type === 'tag') {
      const tag = GitAnnotatedTag.from(object)
      const commit = tag.headers().object
      return walk(commit, isUninteresting)
    }
    if (type !== 'commit') {
      if (isUninteresting) return
      throw new ObjectTypeError(oid, type, 'commit')
    }
    if (!shallows.has(oid)) {
      const commit = GitCommit.from(object)
      const parents = commit.headers().parent
      const { timestamp } = commit.headers().committer
      let i = 0
      while (i < queue.length && queue[i].timestamp >= timestamp) i++
      queue.splice(i, 0, { oid, timestamp, parents })
    }
  }
  for (const oid of finishingSet) {
    await walk(oid, true)
  }
  // Let's go walking!
  for (const oid of startingSet) {
    await walk(oid)
  }
  while (queue.some(entry => !uninteresting.has(entry.oid))) {
    const { oid, parents } = queue.shift()
    // A commit can be marked uninteresting after it was queued
    const isUninteresting = uninteresting.has(oid)
    for (const parent of parents) {
      await walk(parent, isUninteresting)
    }
  }
  for (const oid of uninteresting) {
    visited.delete(oid)
  }
  return visited
}
