// @ts-check
// import diff3 from 'node-diff3'
import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'

import { checkout } from './checkout'
import { config } from './config'
import { currentBranch } from './currentBranch'
import { fetch } from './fetch'
import { merge } from './merge'

/**
 * Fetch and merge commits from a remote repository *(Currently, only fast-forward merges are implemented.)*
 *
 * To monitor progress events, see the documentation for the [`'emitter'` plugin](./plugin_emitter.md).
 *
 * @param {object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {FileSystem} [args.fs] - [deprecated] The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).
 * @param {string} args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.ref] - Which branch to fetch. By default this is the currently checked out branch.
 * @param {string} [args.corsProxy] - Optional [CORS proxy](https://www.npmjs.com/%40isomorphic-git/cors-proxy). Overrides value in repo config.
 * @param {boolean} [args.singleBranch = false] - Instead of the default behavior of fetching all the branches, only fetch a single branch.
 * @param {boolean} [args.fastForwardOnly = false] - Only perform simple fast-forward merges. (Don't create merge commits.)
 * @param {boolean} [args.noGitSuffix = false] - If true, do not auto-append a `.git` suffix to the `url`. (**AWS CodeCommit needs this option**)
 * @param {string} [args.username] - See the [Authentication](./authentication.html) documentation
 * @param {string} [args.password] - See the [Authentication](./authentication.html) documentation
 * @param {string} [args.token] - See the [Authentication](./authentication.html) documentation
 * @param {string} [args.oauth2format] - See the [Authentication](./authentication.html) documentation
 * @param {object} [args.headers] - Additional headers to include in HTTP requests, similar to git's `extraHeader` config
 * @param {string} [args.emitterPrefix = ''] - Scope emitted events by prepending `emitterPrefix` to the event name.
 * @param {Object} [args.author] - passed to [commit](commit.md) when creating a merge commit
 * @param {Object} [args.committer] - passed to [commit](commit.md) when creating a merge commit
 * @param {string} [args.signingKey] - passed to [commit](commit.md) when creating a merge commit
 * @param {boolean} [args.noSubmodules = false] - If true, will not print out an error about missing submodules support. TODO: Skip checkout out submodules when supported instead.
 * @param {boolean} [args.newSubmoduleBehavior = false] - If true, will opt into a newer behavior that improves submodule non-support by at least not accidentally deleting them.
 *
 * @returns {Promise<void>} Resolves successfully when pull operation completes
 *
 * @example
 * await git.pull({
 *   dir: '$input((/))',
 *   ref: '$input((master))',
 *   singleBranch: $input((true))
 * })
 * console.log('done')
 *
 */
export async function pull ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  ref,
  fastForwardOnly = false,
  noGitSuffix = false,
  corsProxy,
  emitterPrefix = '',
  // @ts-ignore
  authUsername,
  // @ts-ignore
  authPassword,
  username = authUsername,
  password = authPassword,
  token,
  oauth2format,
  singleBranch,
  headers = {},
  author,
  committer,
  signingKey,
  noSubmodules = false,
  newSubmoduleBehavior = false
}) {
  try {
    const fs = new FileSystem(_fs)
    // If ref is undefined, use 'HEAD'
    if (!ref) {
      ref = await currentBranch({ fs, gitdir })
    }
    // Fetch from the correct remote.
    const remote = await config({
      gitdir,
      fs,
      path: `branch.${ref}.remote`
    })
    const { fetchHead, fetchHeadDescription } = await fetch({
      dir,
      gitdir,
      fs,
      emitterPrefix,
      noGitSuffix,
      corsProxy,
      ref,
      remote,
      username,
      password,
      token,
      oauth2format,
      singleBranch,
      headers
    })
    // Merge the remote tracking branch into the local one.
    await merge({
      gitdir,
      fs,
      ours: ref,
      theirs: fetchHead,
      fastForwardOnly,
      message: `Merge ${fetchHeadDescription}`,
      author,
      committer,
      signingKey
    })
    await checkout({
      dir,
      gitdir,
      fs,
      ref,
      emitterPrefix,
      noSubmodules,
      newSubmoduleBehavior
    })
  } catch (err) {
    err.caller = 'git.pull'
    throw err
  }
}
