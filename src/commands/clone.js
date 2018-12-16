import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'

import { checkout } from './checkout.js'
import { config } from './config.js'
import { fetch } from './fetch.js'
import { init } from './init.js'

/**
 * Clone a repository
 *
 * @link https://isomorphic-git.github.io/docs/clone.html
 */
export async function clone ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
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
  headers = {},
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
    const { defaultBranch, fetchHead } = await fetch({
      core,
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
      headers,
      tags: !noTags
    })
    if (fetchHead === null) return
    ref = ref || defaultBranch
    ref = ref.replace('refs/heads/', '')
    // Checkout that branch
    await checkout({
      dir,
      gitdir,
      fs,
      emitter,
      emitterPrefix,
      ref,
      remote,
      noCheckout
    })
  } catch (err) {
    err.caller = 'git.clone'
    throw err
  }
}
