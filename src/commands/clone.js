import path from 'path'

import { FileSystem } from '../models/FileSystem.js'
import { cores } from '../utils/plugins.js'

import { checkout } from './checkout.js'
import { config } from './config.js'
import { fetch } from './fetch.js'
import { indexPack } from './indexPack.js'
import { init } from './init.js'

/**
 * Clone a repository
 *
 * @link https://isomorphic-git.github.io/docs/clone.html
 */
export async function clone ({
  core = 'default',
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  emitter = cores.get(core).get('emitter'),
  emitterPrefix = '',
  url,
  noGitSuffix = false,
  corsProxy,
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
  noTags = false,
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
    if (corsProxy) {
      await config({
        gitdir,
        fs,
        path: `http.corsProxy`,
        value: corsProxy
      })
    }
    // Fetch commits
    let { defaultBranch, packfile } = await fetch({
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
      depth,
      since,
      exclude,
      relative,
      singleBranch,
      tags: !noTags
    })
    ref = ref || defaultBranch
    ref = ref.replace('refs/heads/', '')
    // Note: we're indexing the pack eagerly instead of lazily so
    // we get the nice progress events
    if (packfile) {
      await indexPack({
        dir: gitdir,
        gitdir,
        fs,
        emitter,
        emitterPrefix,
        filepath: packfile
      })
    }
    // Checkout that branch
    if (!noCheckout) {
      await checkout({
        dir,
        gitdir,
        fs,
        emitter,
        emitterPrefix,
        ref,
        remote
      })
    }
  } catch (err) {
    err.caller = 'git.clone'
    throw err
  }
}
