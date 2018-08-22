// import diff3 from 'node-diff3'
import path from 'path'

import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
import { cores } from '../utils/plugins.js'

import { currentBranch } from './currentBranch.js'
import { log } from './log'

/**
 * Merge one or more branches (Currently, only fast-forward merges are implemented.)
 *
 * @link https://isomorphic-git.github.io/docs/merge.html
 */
export async function merge ({
  core = 'default',
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  ours,
  theirs,
  fastForwardOnly
}) {
  try {
    const fs = new FileSystem(_fs)
    if (ours === undefined) {
      ours = await currentBranch({ fs, gitdir, fullname: true })
    }
    ours = await GitRefManager.expand({
      fs,
      gitdir,
      ref: ours
    })
    theirs = await GitRefManager.expand({
      fs,
      gitdir,
      ref: theirs
    })
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
      return {
        oid: ourOid,
        alreadyMerged: true
      }
    }
    if (baseOid === ourOid) {
      await GitRefManager.writeRef({ fs, gitdir, ref: ours, value: theirOid })
      return {
        oid: theirOid,
        fastForward: true
      }
    } else {
      // not a simple fast-forward
      if (fastForwardOnly) {
        throw new GitError(E.FastForwardFail)
      }
      throw new GitError(E.MergeNotSupportedFail)
    }
  } catch (err) {
    err.caller = 'git.merge'
    throw err
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
  throw new GitError(E.MergeNotSupportedFail)
}
