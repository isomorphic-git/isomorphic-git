// @ts-check
import { GitRefManager } from '../managers/GitRefManager.js'
import { GitRemoteManager } from '../managers/GitRemoteManager.js'
import { GitShallowManager } from '../managers/GitShallowManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { GitCommit } from '../models/GitCommit.js'
import { E, GitError } from '../models/GitError.js'
import { GitPackIndex } from '../models/GitPackIndex.js'
import { hasObject } from '../storage/hasObject.js'
import { readObject } from '../storage/readObject.js'
import { abbreviateRef } from '../utils/abbreviateRef.js'
import { collect } from '../utils/collect.js'
import { emptyPackfile } from '../utils/emptyPackfile.js'
import { filterCapabilities } from '../utils/filterCapabilities.js'
import { forAwait } from '../utils/forAwait.js'
import { join } from '../utils/join.js'
import { pkg } from '../utils/pkg.js'
import { cores } from '../utils/plugins.js'
import { splitLines } from '../utils/splitLines.js'
import { parseUploadPackResponse } from '../wire/parseUploadPackResponse.js'
import { writeUploadPackRequest } from '../wire/writeUploadPackRequest.js'

import { config } from './config'

/**
 *
 * @typedef {object} FetchResponse - The object returned has the following schema:
 * @property {string | null} defaultBranch - The branch that is cloned if no branch is specified (typically "master")
 * @property {string | null} fetchHead - The SHA-1 object id of the fetched head commit
 * @property {string | null} fetchHeadDescription - a textual description of the branch that was fetched
 * @property {object} [headers] - The HTTP response headers returned by the git server
 * @property {string[]} [pruned] - A list of branches that were pruned, if you provided the `prune` parameter
 *
 */

/**
 * Fetch commits from a remote repository
 *
 * Future versions of isomorphic-git might return additional metadata.
 *
 * To monitor progress events, see the documentation for the [`'emitter'` plugin](./plugin_emitter.md).
 *
 * @param {object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {FileSystem} [args.fs] - [deprecated] The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.url] - The URL of the remote repository. Will be gotten from gitconfig if absent.
 * @param {string} [args.corsProxy] - Optional [CORS proxy](https://www.npmjs.com/%40isomorphic-git/cors-proxy). Overrides value in repo config.
 * @param {string} [args.ref = 'HEAD'] - Which branch to fetch. By default this is the currently checked out branch.
 * @param {boolean} [args.singleBranch = false] - Instead of the default behavior of fetching all the branches, only fetch a single branch.
 * @param {boolean} [args.noGitSuffix = false] - If true, clone will not auto-append a `.git` suffix to the `url`. (**AWS CodeCommit needs this option**)
 * @param {boolean} [args.tags = false] - Also fetch tags
 * @param {string} [args.remote] - What to name the remote that is created.
 * @param {number} [args.depth] - Integer. Determines how much of the git repository's history to retrieve
 * @param {Date} [args.since] - Only fetch commits created after the given date. Mutually exclusive with `depth`.
 * @param {string[]} [args.exclude = []] - A list of branches or tags. Instructs the remote server not to send us any commits reachable from these refs.
 * @param {boolean} [args.relative = false] - Changes the meaning of `depth` to be measured from the current shallow depth rather than from the branch tip.
 * @param {string} [args.username] - See the [Authentication](./authentication.html) documentation
 * @param {string} [args.password] - See the [Authentication](./authentication.html) documentation
 * @param {string} [args.token] - See the [Authentication](./authentication.html) documentation
 * @param {string} [args.oauth2format] - See the [Authentication](./authentication.html) documentation
 * @param {object} [args.headers] - Additional headers to include in HTTP requests, similar to git's `extraHeader` config
 * @param {boolean} [args.prune] - Delete local remote-tracking branches that are not present on the remote
 * @param {boolean} [args.pruneTags] - Prune local tags that don’t exist on the remote, and force-update those tags that differ
 * @param {import('events').EventEmitter} [args.emitter] - [deprecated] Overrides the emitter set via the ['emitter' plugin](./plugin_emitter.md).
 * @param {string} [args.emitterPrefix = ''] - Scope emitted events by prepending `emitterPrefix` to the event name.
 *
 * @returns {Promise<FetchResponse>} Resolves successfully when fetch completes
 * @see FetchResponse
 *
 * @example
 * await git.fetch({
 *   dir: '$input((/))',
 *   corsProxy: 'https://cors.isomorphic-git.org',
 *   url: '$input((https://github.com/isomorphic-git/isomorphic-git))',
 *   ref: '$input((master))',
 *   depth: $input((1)),
 *   singleBranch: $input((true)),
 *   tags: $input((false))
 * })
 * console.log('done')
 *
 */
export async function fetch ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  emitter = cores.get(core).get('emitter'),
  emitterPrefix = '',
  ref = 'HEAD',
  // @ts-ignore
  refs,
  remote,
  url,
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
  depth = null,
  since = null,
  exclude = [],
  relative = false,
  tags = false,
  singleBranch = false,
  headers = {},
  prune = false,
  pruneTags = false,
  // @ts-ignore
  onprogress // deprecated
}) {
  try {
    if (onprogress !== undefined) {
      console.warn(
        'The `onprogress` callback has been deprecated. Please use the more generic `emitter` EventEmitter argument instead.'
      )
    }
    const fs = new FileSystem(_fs)
    const response = await fetchPackfile({
      core,
      gitdir,
      fs,
      emitter,
      emitterPrefix,
      ref,
      refs,
      remote,
      url,
      noGitSuffix,
      corsProxy,
      username,
      password,
      token,
      oauth2format,
      depth,
      since,
      exclude,
      relative,
      tags,
      singleBranch,
      headers,
      prune,
      pruneTags
    })
    if (response === null) {
      return {
        defaultBranch: null,
        fetchHead: null,
        fetchHeadDescription: null
      }
    }
    if (emitter) {
      const lines = splitLines(response.progress)
      forAwait(lines, line => {
        // As a historical accident, 'message' events were trimmed removing valuable information,
        // such as \r by itself which was a single to update the existing line instead of appending a new one.
        // TODO NEXT BREAKING RELEASE: make 'message' behave like 'rawmessage' and remove 'rawmessage'.
        emitter.emit(`${emitterPrefix}message`, line.trim())
        emitter.emit(`${emitterPrefix}rawmessage`, line)
        const matches = line.match(/([^:]*).*\((\d+?)\/(\d+?)\)/)
        if (matches) {
          emitter.emit(`${emitterPrefix}progress`, {
            phase: matches[1].trim(),
            loaded: parseInt(matches[2], 10),
            total: parseInt(matches[3], 10),
            lengthComputable: true
          })
        }
      })
    }
    const packfile = await collect(response.packfile)
    const packfileSha = packfile.slice(-20).toString('hex')
    const res = {
      defaultBranch: response.HEAD,
      fetchHead: response.FETCH_HEAD.oid,
      fetchHeadDescription: response.FETCH_HEAD.description
    }
    if (response.headers) {
      res.headers = response.headers
    }
    if (prune) {
      res.pruned = response.pruned
    }
    // This is a quick fix for the empty .git/objects/pack/pack-.pack file error,
    // which due to the way `git-list-pack` works causes the program to hang when it tries to read it.
    // TODO: Longer term, we should actually:
    // a) NOT concatenate the entire packfile into memory (line 78),
    // b) compute the SHA of the stream except for the last 20 bytes, using the same library used in push.js, and
    // c) compare the computed SHA with the last 20 bytes of the stream before saving to disk, and throwing a "packfile got corrupted during download" error if the SHA doesn't match.
    if (packfileSha !== '' && !emptyPackfile(packfile)) {
      res.packfile = `objects/pack/pack-${packfileSha}.pack`
      const fullpath = join(gitdir, res.packfile)
      await fs.write(fullpath, packfile)
      const getExternalRefDelta = oid => readObject({ fs, gitdir, oid })
      const idx = await GitPackIndex.fromPack({
        pack: packfile,
        getExternalRefDelta,
        emitter,
        emitterPrefix
      })
      await fs.write(fullpath.replace(/\.pack$/, '.idx'), idx.toBuffer())
    }
    return res
  } catch (err) {
    err.caller = 'git.fetch'
    throw err
  }
}

async function fetchPackfile ({
  core,
  gitdir,
  fs: _fs,
  emitter,
  emitterPrefix,
  ref,
  refs = [ref],
  remote,
  url,
  noGitSuffix,
  corsProxy,
  username,
  password,
  token,
  oauth2format,
  depth,
  since,
  exclude,
  relative,
  tags,
  singleBranch,
  headers,
  prune,
  pruneTags
}) {
  const fs = new FileSystem(_fs)
  // Sanity checks
  if (depth !== null) {
    if (Number.isNaN(parseInt(depth))) {
      throw new GitError(E.InvalidDepthParameterError, { depth })
    }
    depth = parseInt(depth)
  }
  // Set missing values
  remote = remote || 'origin'
  if (url === undefined) {
    url = await config({
      fs,
      gitdir,
      path: `remote.${remote}.url`
    })
  }
  if (corsProxy === undefined) {
    corsProxy = await config({ fs, gitdir, path: 'http.corsProxy' })
  }
  let auth = { username, password, token, oauth2format }
  const GitRemoteHTTP = GitRemoteManager.getRemoteHelperFor({ url })
  const remoteHTTP = await GitRemoteHTTP.discover({
    core,
    corsProxy,
    service: 'git-upload-pack',
    url,
    noGitSuffix,
    auth,
    headers
  })
  auth = remoteHTTP.auth // hack to get new credentials from CredentialManager API
  const remoteRefs = remoteHTTP.refs
  // For the special case of an empty repository with no refs, return null.
  if (remoteRefs.size === 0) {
    return null
  }
  // Check that the remote supports the requested features
  if (depth !== null && !remoteHTTP.capabilities.has('shallow')) {
    throw new GitError(E.RemoteDoesNotSupportShallowFail)
  }
  if (since !== null && !remoteHTTP.capabilities.has('deepen-since')) {
    throw new GitError(E.RemoteDoesNotSupportDeepenSinceFail)
  }
  if (exclude.length > 0 && !remoteHTTP.capabilities.has('deepen-not')) {
    throw new GitError(E.RemoteDoesNotSupportDeepenNotFail)
  }
  if (relative === true && !remoteHTTP.capabilities.has('deepen-relative')) {
    throw new GitError(E.RemoteDoesNotSupportDeepenRelativeFail)
  }
  // Figure out the SHA for the requested ref
  const { oid, fullref } = GitRefManager.resolveAgainstMap({
    ref,
    map: remoteRefs
  })
  // Filter out refs we want to ignore: only keep ref we're cloning, HEAD, branches, and tags (if we're keeping them)
  for (const remoteRef of remoteRefs.keys()) {
    if (
      remoteRef === fullref ||
      remoteRef === 'HEAD' ||
      remoteRef.startsWith('refs/heads/') ||
      (tags && remoteRef.startsWith('refs/tags/'))
    ) {
      continue
    }
    remoteRefs.delete(remoteRef)
  }
  // Assemble the application/x-git-upload-pack-request
  const capabilities = filterCapabilities(
    [...remoteHTTP.capabilities],
    [
      'multi_ack_detailed',
      'no-done',
      'side-band-64k',
      'thin-pack',
      'ofs-delta',
      `agent=${pkg.agent}`
    ]
  )
  if (relative) capabilities.push('deepen-relative')
  // Start figuring out which oids from the remote we want to request
  const wants = singleBranch ? [oid] : remoteRefs.values()
  // Come up with a reasonable list of oids to tell the remote we already have
  // (preferably oids that are close ancestors of the branch heads we're fetching)
  const haveRefs = singleBranch
    ? refs
    : await GitRefManager.listRefs({
      fs,
      gitdir,
      filepath: `refs`
    })
  let haves = []
  for (let ref of haveRefs) {
    try {
      ref = await GitRefManager.expand({ fs, gitdir, ref })
      const oid = await GitRefManager.resolve({ fs, gitdir, ref })
      if (await hasObject({ fs, gitdir, oid })) {
        haves.push(oid)
      }
    } catch (err) {}
  }
  haves = [...new Set(haves)]
  const oids = await GitShallowManager.read({ fs, gitdir })
  const shallows = remoteHTTP.capabilities.has('shallow') ? [...oids] : []
  const packstream = writeUploadPackRequest({
    capabilities,
    wants,
    haves,
    shallows,
    depth,
    since,
    exclude
  })
  // CodeCommit will hang up if we don't send a Content-Length header
  // so we can't stream the body.
  const packbuffer = await collect(packstream)
  const raw = await GitRemoteHTTP.connect({
    core,
    emitter,
    emitterPrefix,
    corsProxy,
    service: 'git-upload-pack',
    url,
    noGitSuffix,
    auth,
    body: [packbuffer],
    headers
  })
  const response = await parseUploadPackResponse(raw.body)
  if (raw.headers) {
    response.headers = raw.headers
  }
  // Apply all the 'shallow' and 'unshallow' commands
  for (const oid of response.shallows) {
    if (!oids.has(oid)) {
      // this is in a try/catch mostly because my old test fixtures are missing objects
      try {
        // server says it's shallow, but do we have the parents?
        const { object } = await readObject({ fs, gitdir, oid })
        const commit = new GitCommit(object)
        const hasParents = await Promise.all(
          commit.headers().parent.map(oid => hasObject({ fs, gitdir, oid }))
        )
        const haveAllParents =
          hasParents.length === 0 || hasParents.every(has => has)
        if (!haveAllParents) {
          oids.add(oid)
        }
      } catch (err) {
        oids.add(oid)
      }
    }
  }
  for (const oid of response.unshallows) {
    oids.delete(oid)
  }
  await GitShallowManager.write({ fs, gitdir, oids })
  // Update local remote refs
  if (singleBranch) {
    const refs = new Map([[fullref, oid]])
    // But wait, maybe it was a symref, like 'HEAD'!
    // We need to save all the refs in the symref chain (sigh).
    const symrefs = new Map()
    let bail = 10
    let key = fullref
    while (bail--) {
      const value = remoteHTTP.symrefs.get(key)
      if (value === undefined) break
      symrefs.set(key, value)
      key = value
    }
    // final value must not be a symref but a real ref
    refs.set(key, remoteRefs.get(key))
    const { pruned } = await GitRefManager.updateRemoteRefs({
      fs,
      gitdir,
      remote,
      refs,
      symrefs,
      tags,
      prune
    })
    if (prune) {
      response.pruned = pruned
    }
  } else {
    const { pruned } = await GitRefManager.updateRemoteRefs({
      fs,
      gitdir,
      remote,
      refs: remoteRefs,
      symrefs: remoteHTTP.symrefs,
      tags,
      prune,
      pruneTags
    })
    if (prune) {
      response.pruned = pruned
    }
  }
  // We need this value later for the `clone` command.
  response.HEAD = remoteHTTP.symrefs.get('HEAD')
  // AWS CodeCommit doesn't list HEAD as a symref, but we can reverse engineer it
  // Find the SHA of the branch called HEAD
  if (response.HEAD === undefined) {
    const { oid } = GitRefManager.resolveAgainstMap({
      ref: 'HEAD',
      map: remoteRefs
    })
    // Use the name of the first branch that's not called HEAD that has
    // the same SHA as the branch called HEAD.
    for (const [key, value] of remoteRefs.entries()) {
      if (key !== 'HEAD' && value === oid) {
        response.HEAD = key
        break
      }
    }
  }
  const noun = fullref.startsWith('refs/tags') ? 'tag' : 'branch'
  response.FETCH_HEAD = {
    oid,
    description: `${noun} '${abbreviateRef(fullref)}' of ${url}`
  }
  return response
}
