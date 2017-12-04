import { init } from './init'
import { config } from './config'
import { fetch } from './fetch'
import { checkout } from './checkout'
import { fs as defaultfs, setfs } from '../utils'

/**
 * Clone a repository
 *
 * @param {GitRepo} repo - A {@link Git} object matching `{workdir, gitdir, fs}`
 * @param {Object} args - Arguments object
 * @param {string} args.url - The URL of the remote repository.
 * @param {string} [args.remote='origin'] - What to name the remote that is created. The default is 'origin'.
 * @param {string} [args.ref=undefined] - Which branch to clone. By default this is the designated "main branch" of the repository.
 * @param {string} [args.authUsername=undefined] - The username to use with Basic Auth
 * @param {string} [args.authPassword=undefined] - The password to use with Basic Auth
 * @param {integer} [args.depth=undefined] - Determines how much of the git repository's history to retrieve.
 * @param {Date} [args.since=undefined] - Only fetch commits created after the given date. Mutually exclusive with `depth`.
 * @param {string[]} [args.exclude=[]] - A list of branches or tags. Instructs the remote server not to send us any commits reachable from these refs.
 * @param {boolean} [args.relative=false] - Changes the meaning of `depth` to be measured from the current shallow depth rather than from the branch tip.
 * @param {Function} [args.onprogress=undefined] - Callback to receive [ProgressEvent](https://developer.mozilla.org/en-US/docs/Web/API/ProgressEvent)s for the operation.
 * @returns {Promise<void>} - Resolves successfully when clone completes
 *
 * @example
 * let repo = new Git({fs, dir: '.'})
 * await clone(repo, {
 *   url: 'https://cors-buster-jfpactjnem.now.sh/github.com/wmhilton/isomorphic-git',
 *   depth: 1
 * })
 */
export async function clone (
  { workdir, gitdir, fs = defaultfs() },
  {
    url,
    remote,
    ref,
    authUsername,
    authPassword,
    depth,
    since,
    exclude,
    relative,
    onprogress
  }
) {
  setfs(fs)
  remote = remote || 'origin'
  await init({ gitdir, fs })
  // Add remote
  await config(
    {
      gitdir,
      fs
    },
    {
      path: `remote.${remote}.url`,
      value: url
    }
  )
  // Fetch commits
  await fetch(
    {
      gitdir,
      fs
    },
    {
      ref,
      remote,
      authUsername,
      authPassword,
      depth,
      since,
      exclude,
      relative,
      onprogress
    }
  )
  // Checkout branch
  await checkout(
    {
      workdir,
      gitdir,
      fs
    },
    {
      ref,
      remote
    }
  )
}
