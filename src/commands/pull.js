// import diff3 from 'node-diff3'
import path from 'path'

import { FileSystem } from '../models/FileSystem.js'
import { cores } from '../utils/plugins.js'

import { checkout } from './checkout'
import { config } from './config'
import { currentBranch } from './currentBranch'
import { fetch } from './fetch'
import { merge } from './merge'

/**
 * Fetch and merge commits from a remote repository
 *
 * @link https://isomorphic-git.github.io/docs/pull.html
 */
export async function pull ({
  core = 'default',
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  ref,
  fastForwardOnly = false,
  noGitSuffix = false,
  emitter = cores.get(core).get('emitter'),
  emitterPrefix = '',
  authUsername,
  authPassword,
  username = authUsername,
  password = authPassword,
  token,
  oauth2format,
  singleBranch
}) {
  try {
    const fs = new FileSystem(_fs)
    // If ref is undefined, use 'HEAD'
    if (!ref) {
      ref = await currentBranch({ fs, gitdir })
    }
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
      emitterPrefix,
      noGitSuffix,
      ref,
      remote,
      username,
      password,
      token,
      oauth2format,
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
  } catch (err) {
    err.caller = 'git.pull'
    throw err
  }
}
