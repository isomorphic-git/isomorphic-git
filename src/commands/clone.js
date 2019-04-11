// @ts-check
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
 * To monitor progress events, see the documentation for the [`'emitter'` plugin](./plugin_emitter.md).
 *
 * @param {object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {FileSystem} [args.fs] - [deprecated] The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).
 * @param {string} args.dir - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.url - The URL of the remote repository
 * @param {string} [args.corsProxy] - Optional [CORS proxy](https://www.npmjs.com/%40isomorphic-git/cors-proxy). Value is stored in the git config file for that repo.
 * @param {string} [args.ref] - Which branch to clone. By default this is the designated "main branch" of the repository.
 * @param {boolean} [args.singleBranch = false] - Instead of the default behavior of fetching all the branches, only fetch a single branch.
 * @param {boolean} [args.noCheckout = false] - If true, clone will only fetch the repo, not check out a branch. Skipping checkout can save a lot of time normally spent writing files to disk.
 * @param {boolean} [args.noGitSuffix = false] - If true, clone will not auto-append a `.git` suffix to the `url`. (**AWS CodeCommit needs this option**.)
 * @param {boolean} [args.noTags = false] - By default clone will fetch all tags. `noTags` disables that behavior.
 * @param {string} [args.remote = 'origin'] - What to name the remote that is created.
 * @param {number} [args.depth] - Integer. Determines how much of the git repository's history to retrieve
 * @param {Date} [args.since] - Only fetch commits created after the given date. Mutually exclusive with `depth`.
 * @param {string[]} [args.exclude = []] - A list of branches or tags. Instructs the remote server not to send us any commits reachable from these refs.
 * @param {boolean} [args.relative = false] - Changes the meaning of `depth` to be measured from the current shallow depth rather than from the branch tip.
 * @param {string} [args.username] - See the [Authentication](./authentication.html) documentation
 * @param {string} [args.password] - See the [Authentication](./authentication.html) documentation
 * @param {string} [args.token] - See the [Authentication](./authentication.html) documentation
 * @param {string} [args.oauth2format] - See the [Authentication](./authentication.html) documentation
 * @param {object} [args.headers = {}] - Additional headers to include in HTTP requests, similar to git's `extraHeader` config
 * @param {import('events').EventEmitter} [args.emitter] - [deprecated] Overrides the emitter set via the ['emitter' plugin](./plugin_emitter.md)
 * @param {string} [args.emitterPrefix = ''] - Scope emitted events by prepending `emitterPrefix` to the event name
 *
 * @returns {Promise<void>} Resolves successfully when clone completes
 *
 * @example
 * await git.clone({
 *   dir: '$input((/))',
 *   corsProxy: 'https://cors.isomorphic-git.org',
 *   url: '$input((https://github.com/isomorphic-git/isomorphic-git))',
 *   $textarea((singleBranch: true,
 *   depth: 1))
 * })
 * console.log('done')
 *
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
  corsProxy = undefined,
  ref = undefined,
  remote = 'origin',
  // @ts-ignore
  authUsername,
  // @ts-ignore
  authPassword,
  username = undefined,
  password = undefined,
  token = undefined,
  oauth2format = undefined,
  depth = undefined,
  since = undefined,
  exclude = [],
  relative = false,
  singleBranch = false,
  noCheckout = false,
  noTags = false,
  headers = {},
  // @ts-ignore
  onprogress
}) {
  try {
    if (onprogress !== undefined) {
      console.warn(
        'The `onprogress` callback has been deprecated. Please use the more generic `emitter` EventEmitter argument instead.'
      )
    }
    const fs = new FileSystem(_fs)
    username = username === undefined ? authUsername : username
    password = password === undefined ? authPassword : password
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
