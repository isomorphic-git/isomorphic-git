// @ts-check
import '../typedefs.js'

import { GitRemoteHTTP } from '../managers/GitRemoteHTTP.js'
import { assertParameter } from '../utils/assertParameter.js'
import { parseListRefsResponse } from '../wire/parseListRefsResponse.js'
import { writeListRefsRequest } from '../wire/writeListRefsRequest.js'

/**
 * @typedef {Object} ServerRef - This object has the following schema:
 * @property {string} ref - The name of the ref
 * @property {string} oid - The SHA-1 object id the ref points to
 * @property {string} [target] - The target ref pointed to by a symbolic ref
 * @property {string} [peeled] - If the oid is the SHA-1 object id of an annotated tag, this is the SHA-1 object id that the annotated tag points to
 */

/**
 * Fetch a list of refs (branches, tags, etc) from a server.
 *
 * This is a rare command that doesn't require an `fs`, `dir`, or even `gitdir` argument.
 * It just requires an `http` argument.
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
 * @param {string} [args.prefix] - Only list refs that start with this prefix
 * @param {boolean} [args.symrefs = false] - Include symbolic ref targets
 * @param {boolean} [args.peelTags = false] - Include annotated tag peeled targets
 *
 * @returns {Promise<ServerRef[]>} Resolves successfully with an array of ServerRef objects
 * @see ServerRef
 *
 * @example
 * let refs = await git.listServerRefs({
 *   http,
 *   corsProxy: "https://cors.isomorphic-git.org",
 *   url: "https://github.com/isomorphic-git/isomorphic-git.git"
 * });
 * console.log(refs);
 *
 */
export async function listServerRefs({
  http,
  onAuth,
  onAuthSuccess,
  onAuthFailure,
  corsProxy,
  url,
  headers = {},
  forPush = false,
  protocolVersion = 2,
  prefix,
  symrefs,
  peelTags,
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

    if (remote.protocolVersion === 1) {
      const refs = []
      for (const [key, value] of remote.refs) {
        if (prefix && !key.startsWith(prefix)) continue

        if (key.endsWith('^{}')) {
          if (peelTags) {
            const _key = key.replace('^{}', '')
            // Peeled tags are almost always listed immediately after the original tag
            const last = refs[refs.length - 1]
            const r = last.ref === _key ? last : refs.find(x => x.ref === _key)
            if (r === undefined) {
              throw new Error('I did not expect this to happen')
            }
            r.peeled = value
          }
          continue
        }
        /** @type ServerRef */
        const ref = { ref: key, oid: value }
        if (symrefs) {
          if (remote.symrefs.has(key)) {
            ref.target = remote.symrefs.get(key)
          }
        }
        refs.push(ref)
      }
      return refs
    }

    // Protocol Version 2
    const body = await writeListRefsRequest({ prefix, symrefs, peelTags })

    const res = await GitRemoteHTTP.connect({
      http,
      auth: remote.auth,
      headers,
      corsProxy,
      service: forPush ? 'git-receive-pack' : 'git-upload-pack',
      url,
      body,
    })

    return parseListRefsResponse(res.body)
  } catch (err) {
    err.caller = 'git.listServerRefs'
    throw err
  }
}
