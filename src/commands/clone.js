// @ts-check
import '../typedefs.js'

import { _checkout } from '../commands/checkout.js'
import { _fetch } from '../commands/fetch.js'
import { _init } from '../commands/init.js'
import { setConfig } from '../commands/setConfig.js'

import { _addRemote } from './addRemote.js'

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {HttpClient} args.http
 * @param {ProgressCallback} [args.onProgress]
 * @param {MessageCallback} [args.onMessage]
 * @param {AuthCallback} [args.onAuth]
 * @param {AuthFailureCallback} [args.onAuthFailure]
 * @param {AuthSuccessCallback} [args.onAuthSuccess]
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
  http,
  onProgress,
  onMessage,
  onAuth,
  onAuthSuccess,
  onAuthFailure,
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
  await _init({ fs, gitdir })
  await _addRemote({ fs, gitdir, remote, url, force: false })
  if (corsProxy) {
    await setConfig({
      fs,
      gitdir,
      path: `http.corsProxy`,
      value: corsProxy,
      append: false,
    })
  }
  const { defaultBranch, fetchHead } = await _fetch({
    fs,
    http,
    onProgress,
    onMessage,
    onAuth,
    onAuthSuccess,
    onAuthFailure,
    gitdir,
    ref,
    remote,
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
    onProgress,
    dir,
    gitdir,
    ref,
    remote,
    noCheckout,
  })
}
