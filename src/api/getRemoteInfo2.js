// @ts-check
import '../typedefs.js'

import { GitRemoteHTTP } from '../managers/GitRemoteHTTP.js'
import { assertParameter } from '../utils/assertParameter.js'
import { fromEntries } from '../utils/fromEntries.js'

/**
 * @typedef {Object} GetRemoteInfoResult1 - This object has the following schema:
 * @property {1} protocolVersion - Git Protocol Version 1
 * @property {string[]} capabilities - A list of capabilities
 * @property {Object<string, string>} refs - An object of remote refs and corresponding SHA-1 object ids
 * @property {Object<string, string>} symrefs - An object of remote symrefs and corresponding refs
 */

/**
 * @typedef {Object} GetRemoteInfoResult2 - This object has the following schema:
 * @property {2} protocolVersion - Git Protocol version 2
 * @property {Object<string, string | null>} capabilities - An object of capabilities represented as keys and values
 */

/**
 * List a remote server's capabilities.
 *
 * > The successor to `getRemoteInfo`, this command supports Git Wire Protocol Version 2.
 * > Therefore its return type is more complicated, as *either* a v1 or v2 result is returned.
 * > Also, I've "fixed" the v1 return result so its a flat list of refs.
 * > The nested object thing looked nice to the human eye, but is a pain to deal with programatically.
 *
 * This is a rare command that doesn't require an `fs`, `dir`, or even `gitdir` argument.
 * It just communicates to a remote git server, determining what protocol version, commands, and features it supports.
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
 * @param {1 | 2} [args.protocolVersion = 2] - Which version of the Git Protocol to use.
 *
 * @returns {Promise<GetRemoteInfoResult1 | GetRemoteInfoResult2>} Resolves successfully with an object listing the branches, tags, and capabilities of the remote.
 * @see GetRemoteInfoResult1
 * @see GetRemoteInfoResult2
 *
 * @example
 * let info = await git.getRemoteInfo2({
 *   http,
 *   corsProxy: "https://cors.isomorphic-git.org",
 *   url: "https://github.com/isomorphic-git/isomorphic-git.git"
 * });
 * console.log(info);
 *
 */
export async function getRemoteInfo2({
  http,
  onAuth,
  onAuthSuccess,
  onAuthFailure,
  corsProxy,
  url,
  headers = {},
  forPush = false,
  protocolVersion = 2,
}) {
  try {
    assertParameter('http', http)
    assertParameter('url', url)

    const remote = await GitRemoteHTTP.discover({
      http,
      onAuth,
      onAuthSuccess,
      onAuthFailure,
      corsProxy,
      service: forPush ? 'git-receive-pack' : 'git-upload-pack',
      url,
      headers,
      protocolVersion,
    })

    if (remote.protocolVersion === 2) {
      /** @type GetRemoteInfoResult2 */
      return {
        protocolVersion: remote.protocolVersion,
        capabilities: remote.capabilities2,
      }
    }

    // Note: remote.capabilities, remote.refs, and remote.symrefs are Set and Map objects,
    // but one of the objectives of the public API is to always return JSON-compatible objects
    // so we must JSONify them.
    /** @type GetRemoteInfoResult1 */
    return {
      protocolVersion: 1,
      capabilities: [...remote.capabilities],
      refs: fromEntries(remote.refs),
      symrefs: fromEntries(remote.symrefs),
    }
  } catch (err) {
    err.caller = 'git.getRemoteInfo2'
    throw err
  }
}
