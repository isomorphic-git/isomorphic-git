// @ts-check
import '../commands/typedefs.js'

import { join } from '../utils/join.js'

import { clone as _clone } from '../commands/clone.js'
import { FileSystem } from '../models/FileSystem.js'
import { assertParameter } from '../utils/assertParameter.js'

/**
 * Clone a repository
 *
 * To monitor progress events, see the documentation for the [`'emitter'` plugin](./plugin_emitter.md).
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {HttpClient} [args.http] - an HTTP client
 * @param {ProgressCallback} [args.onProgress] - optional progress event callback
 * @param {MessageCallback} [args.onMessage] - optional message event callback
 * @param {string} args.dir - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.url - The URL of the remote repository
 * @param {string} [args.corsProxy] - Optional [CORS proxy](https://www.npmjs.com/%40isomorphic-git/cors-proxy). Value is stored in the git config file for that repo.
 * @param {string} [args.ref] - Which branch to clone. By default this is the designated "main branch" of the repository.
 * @param {boolean} [args.singleBranch = false] - Instead of the default behavior of fetching all the branches, only fetch a single branch.
 * @param {boolean} [args.noCheckout = false] - If true, clone will only fetch the repo, not check out a branch. Skipping checkout can save a lot of time normally spent writing files to disk.
 * @param {boolean} [args.noSubmodules = false] - If true, clone will not log an error about missing submodule support. TODO: Make this not check out submodules when ther's submodule support
 * @param {boolean} [args.newSubmoduleBehavior = false] - If true, will opt into a newer behavior that improves submodule non-support by at least not accidentally deleting them.
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
 * @param {'github'|'bitbucket'|'gitlab'} [args.oauth2format] - See the [Authentication](./authentication.html) documentation
 * @param {Object<string, string>} [args.headers = {}] - Additional headers to include in HTTP requests, similar to git's `extraHeader` config
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
  fs,
  http,
  onProgress,
  onMessage,
  dir,
  gitdir = join(dir, '.git'),
  url,
  noGitSuffix = false,
  corsProxy = undefined,
  ref = undefined,
  remote = 'origin',
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
  noSubmodules = false,
  newSubmoduleBehavior = false,
  noTags = false,
  headers = {}
}) {
  try {
    assertParameter('fs', fs)
    assertParameter('gitdir', gitdir)
    if (!noCheckout) {
      assertParameter('dir', dir)
    }
    assertParameter('url', url)

    return await _clone({
      fs: new FileSystem(fs),
      http,
      onProgress,
      onMessage,
      dir,
      gitdir,
      url,
      noGitSuffix,
      corsProxy,
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
      noCheckout,
      noSubmodules,
      newSubmoduleBehavior,
      noTags,
      headers
    })
  } catch (err) {
    err.caller = 'git.clone'
    throw err
  }
}
