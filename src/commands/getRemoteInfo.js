// @ts-check
import { GitRemoteHTTP } from '../managers/GitRemoteHTTP.js'

/**
 *
 * @typedef {Object} RemoteDescription - The object returned has the following schema:
 * @property {string[]} capabilities - The list of capabilities returned by the server (part of the Git protocol)
 * @property {Object} [refs]
 * @property {Object<string, string>} [refs.heads] - The branches on the remote
 * @property {Object<string, string>} [refs.pull] - The special branches representing pull requests (non-standard)
 * @property {Object<string, string>} [refs.tags] - The tags on the remote
 *
 */

/**
 * List a remote servers branches, tags, and capabilities.
 *
 * This is a rare command that doesn't require an `fs`, `dir`, or even `gitdir` argument.
 * It just communicates to a remote git server, using the first step of the `git-upload-pack` handshake, but stopping short of fetching the packfile.
 *
 * @param {object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {string} args.url - The URL of the remote repository. Will be gotten from gitconfig if absent.
 * @param {string} [args.corsProxy] - Optional [CORS proxy](https://www.npmjs.com/%40isomorphic-git/cors-proxy). Overrides value in repo config.
 * @param {boolean} [args.forPush = false] - By default, the command queries the 'fetch' capabilities. If true, it will ask for the 'push' capabilities.
 * @param {boolean} [args.noGitSuffix = false] - If true, clone will not auto-append a `.git` suffix to the `url`. (**AWS CodeCommit needs this option**)
 * @param {string} [args.username] - See the [Authentication](./authentication.html) documentation
 * @param {string} [args.password] - See the [Authentication](./authentication.html) documentation
 * @param {string} [args.token] - See the [Authentication](./authentication.html) documentation
 * @param {string} [args.oauth2format] - See the [Authentication](./authentication.html) documentation
 * @param {object} [args.headers] - Additional headers to include in HTTP requests, similar to git's `extraHeader` config
 *
 * @returns {Promise<RemoteDescription>} Resolves successfully with an object listing the branches, tags, and capabilities of the remote.
 * @see RemoteDescription
 *
 * @example
 * let info = await git.getRemoteInfo({
 *   url:
 *     "$input((https://cors.isomorphic-git.org/github.com/isomorphic-git/isomorphic-git.git))"
 * });
 * console.log(info);
 *
 */
export async function getRemoteInfo ({
  core = 'default',
  corsProxy,
  url,
  // @ts-ignore
  authUsername,
  // @ts-ignore
  authPassword,
  noGitSuffix = false,
  username = authUsername,
  password = authPassword,
  token,
  oauth2format,
  headers = {},
  forPush = false
}) {
  try {
    let auth = { username, password, token, oauth2format }
    const remote = await GitRemoteHTTP.discover({
      core,
      corsProxy,
      service: forPush ? 'git-receive-pack' : 'git-upload-pack',
      url,
      noGitSuffix,
      auth,
      headers
    })
    auth = remote.auth // hack to get new credentials from CredentialManager API
    // Note: remote.capabilities, remote.refs, and remote.symrefs are Set and Map objects,
    // but one of the objectives of the public API is to always return JSON-compatible objects
    // so we must JSONify them.
    const result = {
      capabilities: [...remote.capabilities]
    }
    // Convert the flat list into an object tree, because I figure 99% of the time
    // that will be easier to use.
    for (const [ref, oid] of remote.refs) {
      const parts = ref.split('/')
      const last = parts.pop()
      let o = result
      for (const part of parts) {
        o[part] = o[part] || {}
        o = o[part]
      }
      o[last] = oid
    }
    // Merge symrefs on top of refs to more closely match actual git repo layouts
    for (const [symref, ref] of remote.symrefs) {
      const parts = symref.split('/')
      const last = parts.pop()
      let o = result
      for (const part of parts) {
        o[part] = o[part] || {}
        o = o[part]
      }
      o[last] = ref
    }
    return result
  } catch (err) {
    err.caller = 'git.getRemoteInfo'
    throw err
  }
}
