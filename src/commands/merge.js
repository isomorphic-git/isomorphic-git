// import diff3 from 'node-diff3'
import path from 'path'

import { GitRefManager } from '../managers'
import { FileSystem } from '../models'

import { log } from './log'

/**
 * Merge one or more branches (Currently, only fast-forward merges are implemented.)
 *
 * @link https://isomorphic-git.github.io/docs/merge.html
 */
export async function merge ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  ours,
  theirs,
  fastForwardOnly
}) {
  const fs = new FileSystem(_fs)
  let ourOid = await GitRefManager.resolve({
    fs,
    gitdir,
    ref: ours
  })
  let theirOid = await GitRefManager.resolve({
    fs,
    gitdir,
    ref: theirs
  })
  // find most recent common ancestor of ref a and ref b
  let baseOid = await findMergeBase({ gitdir, fs, refs: [ourOid, theirOid] })
  // handle fast-forward case
  if (baseOid === theirOid) {
    console.log(`'${theirs}' is already merged into '${ours}'`)
    return {
      oid: ourOid,
      alreadyMerged: true
    }
  }
  if (baseOid === ourOid) {
    console.log(`Performing a fast-forward merge...`)
    await GitRefManager.writeRef({ fs, gitdir, ref: ours, value: theirOid })
    return {
      oid: theirOid,
      fastForward: true
    }
  } else {
    // not a simple fast-forward
    if (fastForwardOnly) {
      throw new Error('merge.js:53 E22 A simple fast-forward merge was not possible.')
    }
    throw new Error('merge.js:55 E23 Non-fast-forward merges are not supported yet.')
  }
}

function compareAge (a, b) {
  return a.committer.timestamp - b.committer.timestamp
}

async function findMergeBase ({ gitdir, fs, refs }) {
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
  throw new Error('merge.js:87 E24 Non-trivial merge not implemented at this time')
}
