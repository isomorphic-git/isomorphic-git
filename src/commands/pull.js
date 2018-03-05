// import diff3 from 'node-diff3'
import path from 'path'
import { GitRefManager } from '../managers'
import { FileSystem } from '../models'
import { config } from './config'
import { fetch } from './fetch'
import { merge } from './merge'
import { checkout } from './checkout'

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
    ref = await GitRefManager.resolve({
      fs,
      gitdir,
      ref: 'HEAD',
      depth: 1
    })
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
