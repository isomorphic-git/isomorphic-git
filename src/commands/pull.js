// @ts-check

import { checkout } from '../commands/checkout.js'
import { getConfig } from '../commands/getConfig.js'
import { currentBranch } from '../commands/currentBranch.js'
import { fetch } from '../commands/fetch.js'
import { merge } from '../commands/merge.js'
import { join } from '../utils/join.js'

/**
 * Fetch and merge commits from a remote repository *(Currently, only fast-forward merges are implemented.)*
 *
 * To monitor progress events, see the documentation for the [`'emitter'` plugin](./plugin_emitter.md).
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {HttpClient} [args.http] - an HTTP client
 * @param {ProgressCallback} [args.onProgress] - optional progress event callback
 * @param {MessageCallback} [args.onMessage] - optional message event callback
 * @param {FillCallback} [args.onFill] - optional auth fill callback
 * @param {ApprovedCallback} [args.onApproved] - optional auth approved callback
 * @param {RejectedCallback} [args.onRejected] - optional auth rejected callback
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
 * @param {'github' | 'bitbucket' | 'gitlab'} [args.oauth2format] - See the [Authentication](./authentication.html) documentation
 * @param {Object<string, string>} [args.headers] - Additional headers to include in HTTP requests, similar to git's `extraHeader` config
 * @param {Object} [args.author] - The details about the author.
 * @param {string} [args.author.name] - Default is `user.name` config.
 * @param {string} [args.author.email] - Default is `user.email` config.
 * @param {Date} [args.author.date] - Set the author timestamp field. Default is the current date.
 * @param {number} [args.author.timestamp] - Set the author timestamp field. This is an alternative to using `date` using an integer number of seconds since the Unix epoch instead of a JavaScript date object.
 * @param {number} [args.author.timezoneOffset] - Set the author timezone offset field. This is the difference, in minutes, from the current timezone to UTC. Default is `(new Date()).getTimezoneOffset()`.
 * @param {Object} [args.committer = author] - The details about the commit committer, in the same format as the author parameter. If not specified, the author details are used.
 * @param {string} [args.committer.name] - Default is `user.name` config.
 * @param {string} [args.committer.email] - Default is `user.email` config.
 * @param {Date} [args.committer.date] - Set the committer timestamp field. Default is the current date.
 * @param {number} [args.committer.timestamp] - Set the committer timestamp field. This is an alternative to using `date` using an integer number of seconds since the Unix epoch instead of a JavaScript date object.
 * @param {number} [args.committer.timezoneOffset] - Set the committer timezone offset field. This is the difference, in minutes, from the current timezone to UTC. Default is `(new Date()).getTimezoneOffset()`.
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
  fs,
  http,
  onProgress,
  onMessage,
  onFill,
  onApproved,
  onRejected,
  dir,
  gitdir = join(dir, '.git'),
  ref,
  fastForwardOnly = false,
  noGitSuffix = false,
  corsProxy,
  username,
  password,
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
    // If ref is undefined, use 'HEAD'
    if (!ref) {
      ref = await currentBranch({ fs, gitdir })
    }
    // Fetch from the correct remote.
    const remote = await getConfig({
      fs,
      gitdir,
      path: `branch.${ref}.remote`
    })
    const { fetchHead, fetchHeadDescription } = await fetch({
      fs,
      http,
      onProgress,
      onMessage,
      onFill,
      onApproved,
      onRejected,
      dir,
      gitdir,
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
      fs,
      gitdir,
      ours: ref,
      theirs: fetchHead,
      fastForwardOnly,
      message: `Merge ${fetchHeadDescription}`,
      author,
      committer,
      signingKey
    })
    await checkout({
      fs,
      onProgress,
      dir,
      gitdir,
      ref,
      noSubmodules,
      newSubmoduleBehavior
    })
  } catch (err) {
    err.caller = 'git.pull'
    throw err
  }
}
