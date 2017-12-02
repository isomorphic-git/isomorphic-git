import { GitRefManager, GitObjectManager } from '../managers'
import { GitCommit } from '../models'
import { fs as defaultfs, setfs } from '../utils'

export async function listCommits (
  { gitdir, fs = defaultfs() },
  { start, finish }
) {
  setfs(fs)
  let startingSet = new Set()
  let finishingSet = new Set()
  for (let ref of start) {
    startingSet.add(await GitRefManager.resolve({ gitdir, ref }))
  }
  for (let ref of finish) {
    // We may not have these refs locally so we must try/catch
    try {
      let oid = await GitRefManager.resolve({ gitdir, ref })
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
    if (type !== 'commit') {
      throw new Error(`Expected type commit but type is ${type}`)
    }
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
