// import diff3 from 'node-diff3'
import path from 'path'

import { FileSystem } from '../models'

import { currentBranch } from './currentBranch'
import { checkout } from './checkout'
import { config } from './config'
import { fetch } from './fetch'
import { merge } from './merge'

/**
 * Fetch and merge commits from a remote repository
 *
 * @link https://isomorphic-git.github.io/docs/pull.html
 */
export async function pull ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  ref,
  fastForwardOnly = false,
  emitter,
  authUsername,
  authPassword,
  singleBranch
}) {
  const fs = new FileSystem(_fs)
  // If ref is undefined, use 'HEAD'
  if (!ref) {
    ref = await currentBranch({ fs, gitdir })
  }
  console.log(`Using ref=${ref}`)
  // Fetch from the correct remote.
  let remote = await config({
    gitdir,
    fs,
    path: `branch.${ref}.remote`
  })
  let { fetchHead } = await fetch({
    dir,
    gitdir,
    fs,
    emitter,
    ref,
    remote,
    authUsername,
    authPassword,
    singleBranch
  })
  // Merge the remote tracking branch into the local one.
  await merge({
    gitdir,
    fs,
    ours: ref,
    theirs: fetchHead,
    fastForwardOnly
  })
  await checkout({
    dir,
    gitdir,
    fs,
    ref
  })
}
