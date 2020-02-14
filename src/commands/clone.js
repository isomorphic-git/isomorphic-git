// @ts-check
import '../commands/typedefs.js'

import { checkout } from '../commands/checkout.js'
import { fetch } from '../commands/fetch.js'
import { init } from '../commands/init.js'
import { setConfig } from '../commands/setConfig.js'

import { addRemote } from './addRemote.js'

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {HttpClient} args.http
 * @param {ProgressCallback} [args.onProgress]
 * @param {MessageCallback} [args.onMessage]
 * @param {string} [args.dir]
 * @param {string} args.gitdir
 * @param {string} args.url
 * @param {string} args.corsProxy
 * @param {string} args.ref
 * @param {boolean} args.singleBranch
 * @param {boolean} args.noCheckout
 * @param {boolean} args.noGitSuffix
 * @param {boolean} args.noTags
 * @param {string} args.remote
 * @param {number} args.depth
 * @param {Date} args.since
 * @param {string[]} args.exclude
 * @param {boolean} args.relative
 * @param {string} args.username
 * @param {string} args.password
 * @param {string} args.token
 * @param {'github'|'bitbucket'|'gitlab'} args.oauth2format
 * @param {Object<string, string>} args.headers
 *
 * @returns {Promise<void>} Resolves successfully when clone completes
 *
 */
export async function clone ({
  fs,
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
  noTags,
  headers
}) {
  await init({ fs, gitdir })
  await addRemote({ fs, gitdir, remote, url, force: false })
  if (corsProxy) {
    await setConfig({
      fs,
      gitdir,
      path: `http.corsProxy`,
      value: corsProxy,
      append: false
    })
  }
  const { defaultBranch, fetchHead } = await fetch({
    fs,
    http,
    onProgress,
    onMessage,
    gitdir,
    noGitSuffix,
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
    headers,
    tags: !noTags
  })
  if (fetchHead === null) return
  ref = ref || defaultBranch
  ref = ref.replace('refs/heads/', '')
  // Checkout that branch
  await checkout({
    fs,
    onProgress,
    dir,
    gitdir,
    ref,
    remote,
    noCheckout
  })
}
