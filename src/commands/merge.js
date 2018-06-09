// import diff3 from 'node-diff3'
import path from 'path'

import { GitRefManager } from '../managers'
import { FileSystem } from '../models'
import { findMergeBase } from '../utils'

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
  try {
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
        throw new Error('A simple fast-forward merge was not possible.')
      }
      throw new Error('Non-fast-forward merges are not supported yet.')
    }
  } catch (err) {
    err.caller = 'git.merge'
    throw err
  }
}
