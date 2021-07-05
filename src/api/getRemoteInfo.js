// @ts-check
import '../typedefs.js'

import { GitRemoteManager } from '../managers/GitRemoteManager.js'
import { assertParameter } from '../utils/assertParameter.js'

/**
 *
 * @typedef {Object} GetRemoteInfoResult - The object returned has the following schema:
 * @property {string[]} capabilities - The list of capabilities returned by the server (part of the Git protocol)
 * @property {Object} [refs]
 * @property {string} [HEAD] - The default branch of the remote
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
 * @param {HttpClient} args.http - an HTTP client
 * @param {AuthCallback} [args.onAuth] - optional auth fill callback
 * @param {AuthFailureCallback} [args.onAuthFailure] - optional auth rejected callback
 * @param {AuthSuccessCallback} [args.onAuthSuccess] - optional auth approved callback
 * @param {string} args.url - The URL of the remote repository. Will be gotten from gitconfig if absent.
 * @param {string} [args.corsProxy] - Optional [CORS proxy](https://www.npmjs.com/%40isomorphic-git/cors-proxy). Overrides value in repo config.
 * @param {boolean} [args.forPush = false] - By default, the command queries the 'fetch' capabilities. If true, it will ask for the 'push' capabilities.
 * @param {Object<string, string>} [args.headers] - Additional headers to include in HTTP requests, similar to git's `extraHeader` config
 *
 * @returns {Promise<GetRemoteInfoResult>} Resolves successfully with an object listing the branches, tags, and capabilities of the remote.
 * @see GetRemoteInfoResult
 *
 * @example
 * let info = await git.getRemoteInfo({
 *   http,
 *   url:
 *     "https://cors.isomorphic-git.org/github.com/isomorphic-git/isomorphic-git.git"
 * });
 * console.log(info);
 *
 */
export async function getRemoteInfo({
  http,
  onAuth,
  onAuthSuccess,
  onAuthFailure,
  corsProxy,
  url,
  headers = {},
  forPush = false,
}) {
  try {
    assertParameter('http', http)
    assertParameter('url', url)

    const GitRemoteHTTP = GitRemoteManager.getRemoteHelperFor({ url })
    const remote = await GitRemoteHTTP.discover({
      http,
      onAuth,
      onAuthSuccess,
      onAuthFailure,
      corsProxy,
      service: forPush ? 'git-receive-pack' : 'git-upload-pack',
      url,
      headers,
      protocolVersion: 1,
    })

    // Note: remote.capabilities, remote.refs, and remote.symrefs are Set and Map objects,
    // but one of the objectives of the public API is to always return JSON-compatible objects
    // so we must JSONify them.
    const result = {
      capabilities: [...remote.capabilities],
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
