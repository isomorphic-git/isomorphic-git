// @ts-check

import { checkout } from '../commands/checkout.js'
import { currentBranch } from '../commands/currentBranch.js'
import { fetch } from '../commands/fetch.js'
import { getConfig } from '../commands/getConfig.js'
import { merge } from '../commands/merge.js'
import { E, GitError } from '../models/GitError.js'

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {HttpClient} args.http - an HTTP client
 * @param {ProgressCallback} [args.onProgress] - optional progress event callback
 * @param {MessageCallback} [args.onMessage] - optional message event callback
 * @param {AuthCallback} [args.onAuth] - optional auth fill callback
 * @param {AuthSuccessCallback} [args.onAuthSuccess] - optional auth approved callback
 * @param {AuthFailureCallback} [args.onAuthFailure] - optional auth rejected callback
 * @param {string} args.dir
 * @param {string} args.gitdir
 * @param {string} args.ref - Which branch to fetch. By default this is the currently checked out branch.
 * @param {string} [args.corsProxy] - Optional [CORS proxy](https://www.npmjs.com/%40isomorphic-git/cors-proxy). Overrides value in repo config.
 * @param {boolean} args.singleBranch
 * @param {boolean} args.fastForwardOnly
 * @param {boolean} args.noGitSuffix
 * @param {string} [args.username] - See the [Authentication](./authentication.html) documentation
 * @param {string} [args.password] - See the [Authentication](./authentication.html) documentation
 * @param {string} [args.token] - See the [Authentication](./authentication.html) documentation
 * @param {'github' | 'bitbucket' | 'gitlab'} [args.oauth2format] - See the [Authentication](./authentication.html) documentation
 * @param {Object<string, string>} [args.headers] - Additional headers to include in HTTP requests, similar to git's `extraHeader` config
 * @param {Object} args.author
 * @param {string} args.author.name
 * @param {string} args.author.email
 * @param {number} args.author.timestamp
 * @param {number} args.author.timezoneOffset
 * @param {Object} args.committer
 * @param {string} args.committer.name
 * @param {string} args.committer.email
 * @param {number} args.committer.timestamp
 * @param {number} args.committer.timezoneOffset
 * @param {string} [args.signingKey] - passed to [commit](commit.md) when creating a merge commit
 * @param {boolean} [args.noSubmodules = false] - If true, will not print out an error about missing submodules support. TODO: Skip checkout out submodules when supported instead.
 * @param {boolean} [args.newSubmoduleBehavior = false] - If true, will opt into a newer behavior that improves submodule non-support by at least not accidentally deleting them.
 *
 * @returns {Promise<void>} Resolves successfully when pull operation completes
 *
 */
export async function pull ({
  fs,
  http,
  onProgress,
  onMessage,
  onAuth,
  onAuthSuccess,
  onAuthFailure,
  dir,
  gitdir,
  ref,
  fastForwardOnly,
  noGitSuffix,
  corsProxy,
  username,
  password,
  token,
  oauth2format,
  singleBranch,
  headers,
  author,
  committer,
  signingKey,
  noSubmodules,
  newSubmoduleBehavior
}) {
  try {
    // If ref is undefined, use 'HEAD'
    if (!ref) {
      const head = await currentBranch({ fs, gitdir })
      // TODO: use a better error.
      if (!head) {
        throw new GitError(E.MissingRequiredParameterError, {
          parameter: 'ref'
        })
      }
      ref = head
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
      onAuth,
      onAuthSuccess,
      onAuthFailure,
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
      signingKey,
      dryRun: false,
      noUpdateBranch: false
    })
    await checkout({
      fs,
      onProgress,
      dir,
      gitdir,
      ref,
      remote,
      noSubmodules,
      newSubmoduleBehavior,
      noCheckout: false
    })
  } catch (err) {
    err.caller = 'git.pull'
    throw err
  }
}
