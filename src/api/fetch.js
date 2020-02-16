// @ts-check
import '../typedefs.js'

import { fetch as _fetch } from '../commands/fetch.js'
import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
import { assertParameter } from '../utils/assertParameter.js'
import { join } from '../utils/join.js'

/**
 *
 * @typedef {object} FetchResult - The object returned has the following schema:
 * @property {string | null} defaultBranch - The branch that is cloned if no branch is specified (typically "master")
 * @property {string | null} fetchHead - The SHA-1 object id of the fetched head commit
 * @property {string | null} fetchHeadDescription - a textual description of the branch that was fetched
 * @property {Object<string, string>} [headers] - The HTTP response headers returned by the git server
 * @property {string[]} [pruned] - A list of branches that were pruned, if you provided the `prune` parameter
 *
 */

/**
 * Fetch commits from a remote repository
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {HttpClient} args.http - an HTTP client
 * @param {ProgressCallback} [args.onProgress] - optional progress event callback
 * @param {MessageCallback} [args.onMessage] - optional message event callback
 * @param {AuthCallback} [args.onAuth] - optional auth fill callback
 * @param {AuthSuccessCallback} [args.onAuthSuccess] - optional auth approved callback
 * @param {AuthFailureCallback} [args.onAuthFailure] - optional auth rejected callback
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.ref] - Which branch to fetch. By default this is the currently checked out branch.
 * @param {string} [args.url] - The URL of the remote repository. The default is the value set in the git config for that remote.
 * @param {string} [args.remote] - If URL is not specified, determines which remote to use.
 * @param {string} [args.remoteRef] - The name of the branch on the remote to fetch. By default this is the configured remote tracking branch.
 * @param {boolean} [args.singleBranch = false] - Instead of the default behavior of fetching all the branches, only fetch a single branch.
 * @param {boolean} [args.tags = false] - Also fetch tags
 * @param {number} [args.depth] - Integer. Determines how much of the git repository's history to retrieve
 * @param {boolean} [args.relative = false] - Changes the meaning of `depth` to be measured from the current shallow depth rather than from the branch tip.
 * @param {Date} [args.since] - Only fetch commits created after the given date. Mutually exclusive with `depth`.
 * @param {string[]} [args.exclude = []] - A list of branches or tags. Instructs the remote server not to send us any commits reachable from these refs.
 * @param {boolean} [args.prune] - Delete local remote-tracking branches that are not present on the remote
 * @param {boolean} [args.pruneTags] - Prune local tags that don’t exist on the remote, and force-update those tags that differ
 * @param {boolean} [args.noGitSuffix = false] - If true, clone will not auto-append a `.git` suffix to the `url`. (**AWS CodeCommit needs this option**)
 * @param {string} [args.corsProxy] - Optional [CORS proxy](https://www.npmjs.com/%40isomorphic-git/cors-proxy). Overrides value in repo config.
 * @param {string} [args.username] - See the [Authentication](./authentication.html) documentation
 * @param {string} [args.password] - See the [Authentication](./authentication.html) documentation
 * @param {string} [args.token] - See the [Authentication](./authentication.html) documentation
 * @param {'github' | 'bitbucket' | 'gitlab'} [args.oauth2format] - See the [Authentication](./authentication.html) documentation
 * @param {Object<string, string>} [args.headers] - Additional headers to include in HTTP requests, similar to git's `extraHeader` config
 *
 * @returns {Promise<FetchResult>} Resolves successfully when fetch completes
 * @see FetchResult
 *
 * @example
 * let result = await git.fetch({
 *   fs,
 *   http,
 *   dir: '/tutorial',
 *   corsProxy: 'https://cors.isomorphic-git.org',
 *   url: 'https://github.com/isomorphic-git/isomorphic-git',
 *   ref: 'master',
 *   depth: 1,
 *   singleBranch: true,
 *   tags: false
 * })
 * console.log(result)
 *
 */
export async function fetch({
  fs,
  http,
  onProgress,
  onMessage,
  onAuth,
  onAuthSuccess,
  onAuthFailure,
  dir,
  gitdir = join(dir, '.git'),
  ref = 'HEAD',
  remote,
  remoteRef,
  url,
  noGitSuffix = false,
  corsProxy,
  username,
  password,
  token,
  oauth2format,
  depth = null,
  since = null,
  exclude = [],
  relative = false,
  tags = false,
  singleBranch = false,
  headers = {},
  prune = false,
  pruneTags = false,
}) {
  try {
    assertParameter('fs', fs)
    assertParameter('gitdir', gitdir)

    // Sanity checks
    if (depth !== null) {
      // @ts-ignore
      if (Number.isNaN(parseInt(depth))) {
        throw new GitError(E.InvalidDepthParameterError, { depth })
      }
      // @ts-ignore
      depth = parseInt(depth)
    }

    return await _fetch({
      fs: new FileSystem(fs),
      http,
      onProgress,
      onMessage,
      onAuth,
      onAuthSuccess,
      onAuthFailure,
      gitdir,
      ref,
      remote,
      remoteRef,
      url,
      noGitSuffix,
      corsProxy,
      username,
      password,
      token,
      oauth2format,
      depth,
      since,
      exclude,
      relative,
      tags,
      singleBranch,
      headers,
      prune,
      pruneTags,
    })
  } catch (err) {
    err.caller = 'git.fetch'
    throw err
  }
}
