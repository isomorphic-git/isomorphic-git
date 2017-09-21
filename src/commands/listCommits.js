// @flow
import assert from 'assert'
import GitCommit from '../models/GitCommit'
import resolveRef from '../utils/resolveRef'
import GitObjectManager from '../managers/GitObjectManager'

export default async function listCommits ({
  gitdir /*: string */,
  start /*: Array<string> */,
  finish /*: Array<string> */
}) {
  let startingSet = new Set()
  let finishingSet = new Set()
  for (let ref of start) {
    startingSet.add(await resolveRef({ gitdir, ref }))
  }
  for (let ref of finish) {
    // We may not have these refs locally so we must try/catch
    try {
      let oid = await resolveRef({ gitdir, ref })
      finishingSet.add(oid)
    } catch (err) {}
  }
  let visited = new Set() /*: Set<string> */

  // Because git commits are named by their hash, there is no
  // way to construct a cycle. Therefore we won't worry about
  // setting a default recursion limit.
  async function walk (oid) {
    visited.add(oid)
    let { type, object } = await GitObjectManager.read({ gitdir, oid })
    assert(type === 'commit')
    let commit = GitCommit.from(object)
    let parents = commit.headers().parent
    for (oid of parents) {
      if (!finishingSet.has(oid) && !visited.has(oid)) {
        await walk(oid)
      }
    }
  }

  // Let's go walking!
  for (let oid of startingSet) {
    await walk(oid)
  }
  return visited
}
