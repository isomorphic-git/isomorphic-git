// @ts-check
import '../typedefs.js'

import { _addRemote } from '../commands/addRemote.js'
import { _checkout } from '../commands/checkout.js'
import { _fetch } from '../commands/fetch.js'
import { _init } from '../commands/init.js'
import { GitConfigManager } from '../managers/GitConfigManager.js'

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {object} args.cache
 * @param {HttpClient} args.http
 * @param {ProgressCallback} [args.onProgress]
 * @param {MessageCallback} [args.onMessage]
 * @param {AuthCallback} [args.onAuth]
 * @param {AuthFailureCallback} [args.onAuthFailure]
 * @param {AuthSuccessCallback} [args.onAuthSuccess]
 * @param {PostCheckoutCallback} [args.onPostCheckout]
 * @param {string} [args.dir]
 * @param {string} args.gitdir
 * @param {string} args.url
 * @param {string} args.corsProxy
 * @param {string} args.ref
 * @param {boolean} args.singleBranch
 * @param {boolean} args.noCheckout
 * @param {boolean} args.noTags
 * @param {string} args.remote
 * @param {number} args.depth
 * @param {Date} args.since
 * @param {string[]} args.exclude
 * @param {boolean} args.relative
 * @param {Object<string, string>} args.headers
 *
 * @returns {Promise<void>} Resolves successfully when clone completes
 *
 */
export async function _clone({
  fs,
  cache,
  http,
  onProgress,
  onMessage,
  onAuth,
  onAuthSuccess,
  onAuthFailure,
  onPostCheckout,
  dir,
  gitdir,
  url,
  corsProxy,
  ref,
  remote,
  depth,
  since,
  exclude,
  relative,
  singleBranch,
  noCheckout,
  noTags,
  headers,
}) {
  try {
    await _init({ fs, gitdir })
    await _addRemote({ fs, gitdir, remote, url, force: false })
    if (corsProxy) {
      const config = await GitConfigManager.get({ fs, gitdir })
      await config.set(`http.corsProxy`, corsProxy)
      await GitConfigManager.save({ fs, gitdir, config })
    }
    const { defaultBranch, fetchHead } = await _fetch({
      fs,
      cache,
      http,
      onProgress,
      onMessage,
      onAuth,
      onAuthSuccess,
      onAuthFailure,
      gitdir,
      ref,
      remote,
      corsProxy,
      depth,
      since,
      exclude,
      relative,
      singleBranch,
      headers,
      tags: !noTags,
    })
    if (fetchHead === null) return
    ref = ref || defaultBranch
    ref = ref.replace('refs/heads/', '')
    // Checkout that branch
    await _checkout({
      fs,
      cache,
      onProgress,
      onPostCheckout,
      dir,
      gitdir,
      ref,
      remote,
      noCheckout,
    })
  } catch (err) {
    // Remove partial local repository, see #1283
    // Ignore any error as we are already failing.
    // The catch is necessary so the original error is not masked.
    await fs
      .rmdir(gitdir, { recursive: true, maxRetries: 10 })
      .catch(() => undefined)
    throw err
  }
}
