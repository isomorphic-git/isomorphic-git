import path from 'path'

import { FileSystem } from '../models'

import { checkout } from './checkout'
import { config } from './config'
import { fetch } from './fetch'
import { init } from './init'

/**
 * Clone a repository
 *
 * @link https://isomorphic-git.github.io/docs/clone.html
 */
export async function clone ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  emitter,
  url,
  noGitSuffix = false,
  ref,
  remote,
  authUsername,
  authPassword,
  username = authUsername,
  password = authPassword,
  token,
  oauth2format,
  depth,
  since,
  exclude,
  relative,
  singleBranch,
  noCheckout = false,
  onprogress
}) {
  try {
    if (onprogress !== undefined) {
      console.warn(
        'The `onprogress` callback has been deprecated. Please use the more generic `emitter` EventEmitter argument instead.'
      )
    }
    const fs = new FileSystem(_fs)
    remote = remote || 'origin'
    await init({ gitdir, fs })
    // Add remote
    await config({
      gitdir,
      fs,
      path: `remote.${remote}.url`,
      value: url
    })
    await config({
      gitdir,
      fs,
      path: `remote.${remote}.fetch`,
      value: `+refs/heads/*:refs/remotes/${remote}/*`
    })
    // Fetch commits
    let { defaultBranch } = await fetch({
      gitdir,
      fs,
      emitter,
      noGitSuffix,
      ref,
      remote,
      username,
      password,
      token,
      oauth2format,
      depth,
      since,
      exclude,
      relative,
      singleBranch,
      tags: true
    })
    ref = ref || defaultBranch
    ref = ref.replace('refs/heads/', '')
    // Checkout that branch
    if (!noCheckout) {
      await checkout({
        dir,
        gitdir,
        fs,
        ref,
        remote
      })
    }
  } catch (err) {
    err.caller = 'git.clone'
    throw err
  }
}
