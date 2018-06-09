import { log } from '../commands'

import { compareAge } from './compareAge'

export async function findMergeBase ({ gitdir, fs, refs }) {
  // Where is async flatMap when you need it?
  let commits = []
  for (const ref of refs) {
    let list = await log({ gitdir, fs, ref, depth: 1 })
    commits.push(list[0])
  }
  // Are they actually the same commit?
  if (commits.every(commit => commit.oid === commits[0].oid)) {
    return commits[0].oid
  }
  // Is the oldest commit an ancestor of the others?
  let sorted = commits.sort(compareAge)
  let candidate = sorted[0]
  let since = candidate.timestamp - 1
  for (const ref of refs) {
    let list = await log({ gitdir, fs, ref, since })
    if (!list.find(commit => commit.oid === candidate.oid)) {
      candidate = null
      break
    }
  }
  if (candidate) return candidate.oid
  // Is...
  throw new Error('Non-trivial merge not implemented at this time')
}
