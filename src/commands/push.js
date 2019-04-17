// @ts-check
import { GitRefManager } from '../managers/GitRefManager.js'
import { GitRemoteManager } from '../managers/GitRemoteManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
import { GitSideBand } from '../models/GitSideBand.js'
import { filterCapabilities } from '../utils/filterCapabilities.js'
import { forAwait } from '../utils/forAwait.js'
import { join } from '../utils/join.js'
import { pkg } from '../utils/pkg.js'
import { cores } from '../utils/plugins.js'
import { splitLines } from '../utils/splitLines.js'
import { parseReceivePackResponse } from '../wire/parseReceivePackResponse.js'
import { writeReceivePackRequest } from '../wire/writeReceivePackRequest.js'

import { config } from './config.js'
import { findMergeBase } from './findMergeBase.js'
import { isDescendent } from './isDescendent.js'
import { listCommitsAndTags } from './listCommitsAndTags.js'
import { listObjects } from './listObjects.js'
import { pack } from './pack.js'

/**
 *
 * @typedef {Object} PushResponse - Returns an object with a schema like this:
 * @property {string[]} [ok]
 * @property {string[]} [errors]
 * @property {object} [headers]
 *
 */

/**
 * Push a branch or tag
 *
 * > *Note:* The behavior of `remoteRef` is reasonable but not the _correct_ behavior. It _should_ be using the configured remote tracking branch! TODO: I need to fix this
 *
 * The push command returns an object that describes the result of the attempted push operation.
 * *Notes:* If there were no errors, then there will be no `errors` property. There can be a mix of `ok` messages and `errors` messages.
 *
 * | param  | type [= default] | description                                                                                                                                                                                                      |
 * | ------ | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
 * | ok     | Array\<string\>  | The first item is "unpack" if the overall operation was successful. The remaining items are the names of refs that were updated successfully.                                                                    |
 * | errors | Array\<string\>  | If the overall operation threw and error, the first item will be "unpack {Overall error message}". The remaining items are individual refs that failed to be updated in the format "{ref name} {error message}". |
 *
 * To monitor progress events, see the documentation for the [`'emitter'` plugin](./plugin_emitter.md).
 *
 * @param {object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {FileSystem} [args.fs] - [deprecated] The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.ref] - Which branch to push. By default this is the currently checked out branch.
 * @param {string} [args.remoteRef] - The name of the receiving branch on the remote. By default this is the same as `ref`. (See note below)
 * @param {string} [args.remote] - If URL is not specified, determines which remote to use.
 * @param {boolean} [args.force = false] - If true, behaves the same as `git push --force`
 * @param {boolean} [args.noGitSuffix = false] - If true, do not auto-append a `.git` suffix to the `url`. (**AWS CodeCommit needs this option**)
 * @param {string} [args.url] - The URL of the remote git server. The default is the value set in the git config for that remote.
 * @param {string} [args.corsProxy] - Optional [CORS proxy](https://www.npmjs.com/%40isomorphic-git/cors-proxy). Overrides value in repo config.
 * @param {string} [args.username] - See the [Authentication](./authentication.html) documentation
 * @param {string} [args.password] - See the [Authentication](./authentication.html) documentation
 * @param {string} [args.token] - See the [Authentication](./authentication.html) documentation
 * @param {string} [args.oauth2format] - See the [Authentication](./authentication.html) documentation
 * @param {object} [args.headers] - Additional headers to include in HTTP requests, similar to git's `extraHeader` config
 * @param {import('events').EventEmitter} [args.emitter] - [deprecated] Overrides the emitter set via the ['emitter' plugin](./plugin_emitter.md).
 * @param {string} [args.emitterPrefix = ''] - Scope emitted events by prepending `emitterPrefix` to the event name.
 *
 * @returns {Promise<PushResponse>} Resolves successfully when push completes with a detailed description of the operation from the server.
 * @see PushResponse
 *
 * @example
 * let pushResponse = await git.push({
 *   dir: '$input((/))',
 *   remote: '$input((origin))',
 *   ref: '$input((master))',
 *   token: $input((process.env.GITHUB_TOKEN)),
 * })
 * console.log(pushResponse)
 *
 */
export async function push ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  emitter = cores.get(core).get('emitter'),
  emitterPrefix = '',
  ref,
  remoteRef,
  remote = 'origin',
  url,
  force = false,
  noGitSuffix = false,
  corsProxy,
  // @ts-ignore
  authUsername,
  // @ts-ignore
  authPassword,
  username = authUsername,
  password = authPassword,
  token,
  oauth2format,
  headers = {}
}) {
  try {
    const fs = new FileSystem(_fs)
    // TODO: Figure out how pushing tags works. (This only works for branches.)
    if (url === undefined) {
      url = await config({ fs, gitdir, path: `remote.${remote}.url` })
    }
    if (corsProxy === undefined) {
      corsProxy = await config({ fs, gitdir, path: 'http.corsProxy' })
    }
    let fullRef
    if (!ref) {
      fullRef = await GitRefManager.resolve({
        fs,
        gitdir,
        ref: 'HEAD',
        depth: 2
      })
    } else {
      fullRef = await GitRefManager.expand({ fs, gitdir, ref })
    }
    let oid = await GitRefManager.resolve({ fs, gitdir, ref: fullRef })
    let auth = { username, password, token, oauth2format }
    let GitRemoteHTTP = GitRemoteManager.getRemoteHelperFor({ url })
    const httpRemote = await GitRemoteHTTP.discover({
      core,
      corsProxy,
      service: 'git-receive-pack',
      url,
      noGitSuffix,
      auth,
      headers
    })
    auth = httpRemote.auth // hack to get new credentials from CredentialManager API
    let fullRemoteRef
    if (!remoteRef) {
      fullRemoteRef = fullRef
    } else {
      try {
        fullRemoteRef = await GitRefManager.expandAgainstMap({
          ref: remoteRef,
          map: httpRemote.refs
        })
      } catch (err) {
        if (err.code === E.ExpandRefError) {
          // The remote reference doesn't exist yet.
          // If it is fully specified, use that value. Otherwise, treat it as a branch.
          fullRemoteRef = remoteRef.startsWith('refs/')
            ? remoteRef
            : `refs/heads/${remoteRef}`
        } else {
          throw err
        }
      }
    }
    let oldoid =
      httpRemote.refs.get(fullRemoteRef) ||
      '0000000000000000000000000000000000000000'
    let finish = [...httpRemote.refs.values()]
    // hack to speed up common force push scenarios
    // @ts-ignore
    let mergebase = await findMergeBase({ fs, gitdir, oids: [oid, oldoid] })
    for (let oid of mergebase) finish.push(oid)
    // @ts-ignore
    let commits = await listCommitsAndTags({
      fs,
      gitdir,
      start: [oid],
      finish
    })
    // @ts-ignore
    let objects = await listObjects({ fs, gitdir, oids: commits })
    if (!force) {
      // Is it a tag that already exists?
      if (
        fullRef.startsWith('refs/tags') &&
        oldoid !== '0000000000000000000000000000000000000000'
      ) {
        throw new GitError(E.PushRejectedTagExists, {})
      }
      // Is it a non-fast-forward commit?
      if (
        oid !== '0000000000000000000000000000000000000000' &&
        oldoid !== '0000000000000000000000000000000000000000' &&
        !(await isDescendent({ fs, gitdir, oid, ancestor: oldoid }))
      ) {
        throw new GitError(E.PushRejectedNonFastForward, {})
      }
    }
    // We can only safely use capabilities that the server also understands.
    // For instance, AWS CodeCommit aborts a push if you include the `agent`!!!
    const capabilities = filterCapabilities(
      [...httpRemote.capabilities],
      ['report-status', 'side-band-64k', `agent=${pkg.agent}`]
    )
    let packstream1 = await writeReceivePackRequest({
      capabilities,
      triplets: [{ oldoid, oid, fullRef: fullRemoteRef }]
    })
    let packstream2 = await pack({
      fs,
      gitdir,
      oids: [...objects]
    })
    let res = await GitRemoteHTTP.connect({
      core,
      emitter,
      emitterPrefix,
      corsProxy,
      service: 'git-receive-pack',
      url,
      noGitSuffix,
      auth,
      headers,
      body: [...packstream1, ...packstream2]
    })
    let { packfile, progress } = await GitSideBand.demux(res.body)
    if (emitter) {
      let lines = splitLines(progress)
      forAwait(lines, line => {
        emitter.emit(`${emitterPrefix}message`, line)
      })
    }
    // Parse the response!
    let result = await parseReceivePackResponse(packfile)
    if (res.headers) {
      result.headers = res.headers
    }
    return result
  } catch (err) {
    err.caller = 'git.push'
    throw err
  }
}
