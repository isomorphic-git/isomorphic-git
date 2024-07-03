// @ts-check
import '../typedefs.js'

import { _currentBranch } from '../commands/currentBranch.js'
import { _findMergeBase } from '../commands/findMergeBase.js'
import { _isDescendent } from '../commands/isDescendent.js'
import { listCommitsAndTags } from '../commands/listCommitsAndTags.js'
import { listObjects } from '../commands/listObjects.js'
import { _pack } from '../commands/pack.js'
import { GitPushError } from '../errors/GitPushError.js'
import { MissingParameterError } from '../errors/MissingParameterError.js'
import { NotFoundError } from '../errors/NotFoundError.js'
import { PushRejectedError } from '../errors/PushRejectedError.js'
import { UserCanceledError } from '../errors/UserCanceledError.js'
import { GitConfigManager } from '../managers/GitConfigManager.js'
import { GitRefManager } from '../managers/GitRefManager.js'
import { GitRemoteManager } from '../managers/GitRemoteManager.js'
import { GitSideBand } from '../models/GitSideBand.js'
import { filterCapabilities } from '../utils/filterCapabilities.js'
import { forAwait } from '../utils/forAwait.js'
import { pkg } from '../utils/pkg.js'
import { splitLines } from '../utils/splitLines.js'
import { parseReceivePackResponse } from '../wire/parseReceivePackResponse.js'
import { writeReceivePackRequest } from '../wire/writeReceivePackRequest.js'

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {any} args.cache
 * @param {HttpClient} args.http
 * @param {ProgressCallback} [args.onProgress]
 * @param {MessageCallback} [args.onMessage]
 * @param {AuthCallback} [args.onAuth]
 * @param {AuthFailureCallback} [args.onAuthFailure]
 * @param {AuthSuccessCallback} [args.onAuthSuccess]
 * @param {PrePushCallback} [args.onPrePush]
 * @param {string} args.gitdir
 * @param {string} [args.ref]
 * @param {string} [args.remoteRef]
 * @param {string} [args.remote]
 * @param {boolean} [args.force = false]
 * @param {boolean} [args.delete = false]
 * @param {string} [args.url]
 * @param {string} [args.corsProxy]
 * @param {Object<string, string>} [args.headers]
 *
 * @returns {Promise<PushResult>}
 */
export async function _push({
  fs,
  cache,
  http,
  onProgress,
  onMessage,
  onAuth,
  onAuthSuccess,
  onAuthFailure,
  onPrePush,
  gitdir,
  ref: _ref,
  remoteRef: _remoteRef,
  remote,
  url: _url,
  force = false,
  delete: _delete = false,
  corsProxy,
  headers = {},
}) {
  const ref = _ref || (await _currentBranch({ fs, gitdir }))
  if (typeof ref === 'undefined') {
    throw new MissingParameterError('ref')
  }
  const config = await GitConfigManager.get({ fs, gitdir })
  // Figure out what remote to use.
  remote =
    remote ||
    (await config.get(`branch.${ref}.pushRemote`)) ||
    (await config.get('remote.pushDefault')) ||
    (await config.get(`branch.${ref}.remote`)) ||
    'origin'
  // Lookup the URL for the given remote.
  const url =
    _url ||
    (await config.get(`remote.${remote}.pushurl`)) ||
    (await config.get(`remote.${remote}.url`))
  if (typeof url === 'undefined') {
    throw new MissingParameterError('remote OR url')
  }
  // Figure out what remote ref to use.
  const remoteRef = _remoteRef || (await config.get(`branch.${ref}.merge`))
  if (typeof url === 'undefined') {
    throw new MissingParameterError('remoteRef')
  }

  if (corsProxy === undefined) {
    corsProxy = await config.get('http.corsProxy')
  }

  const fullRef = await GitRefManager.expand({ fs, gitdir, ref })
  const oid = _delete
    ? '0000000000000000000000000000000000000000'
    : await GitRefManager.resolve({ fs, gitdir, ref: fullRef })

  /** @type typeof import("../managers/GitRemoteHTTP").GitRemoteHTTP */
  const GitRemoteHTTP = GitRemoteManager.getRemoteHelperFor({ url })
  const httpRemote = await GitRemoteHTTP.discover({
    http,
    onAuth,
    onAuthSuccess,
    onAuthFailure,
    corsProxy,
    service: 'git-receive-pack',
    url,
    headers,
    protocolVersion: 1,
  })
  const auth = httpRemote.auth // hack to get new credentials from CredentialManager API
  let fullRemoteRef
  if (!remoteRef) {
    fullRemoteRef = fullRef
  } else {
    try {
      fullRemoteRef = await GitRefManager.expandAgainstMap({
        ref: remoteRef,
        map: httpRemote.refs,
      })
    } catch (err) {
      if (err instanceof NotFoundError) {
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
  const oldoid =
    httpRemote.refs.get(fullRemoteRef) ||
    '0000000000000000000000000000000000000000'

  if (onPrePush) {
    const hookCancel = await onPrePush({
      remote,
      url,
      localRef: { ref: _delete ? '(delete)' : fullRef, oid: oid },
      remoteRef: { ref: fullRemoteRef, oid: oldoid },
    })
    if (!hookCancel) throw new UserCanceledError()
  }

  // Remotes can always accept thin-packs UNLESS they specify the 'no-thin' capability
  const thinPack = !httpRemote.capabilities.has('no-thin')

  let objects = new Set()
  if (!_delete) {
    const finish = [...httpRemote.refs.values()]
    let skipObjects = new Set()

    // If remote branch is present, look for a common merge base.
    if (oldoid !== '0000000000000000000000000000000000000000') {
      // trick to speed up common force push scenarios
      const mergebase = await _findMergeBase({
        fs,
        cache,
        gitdir,
        oids: [oid, oldoid],
      })
      for (const oid of mergebase) finish.push(oid)
      if (thinPack) {
        skipObjects = await listObjects({ fs, cache, gitdir, oids: mergebase })
      }
    }

    // If remote does not have the commit, figure out the objects to send
    if (!finish.includes(oid)) {
      const commits = await listCommitsAndTags({
        fs,
        cache,
        gitdir,
        start: [oid],
        finish,
      })
      objects = await listObjects({ fs, cache, gitdir, oids: commits })
    }

    if (thinPack) {
      // If there's a default branch for the remote lets skip those objects too.
      // Since this is an optional optimization, we just catch and continue if there is
      // an error (because we can't find a default branch, or can't find a commit, etc)
      try {
        // Sadly, the discovery phase with 'forPush' doesn't return symrefs, so we have to
        // rely on existing ones.
        const ref = await GitRefManager.resolve({
          fs,
          gitdir,
          ref: `refs/remotes/${remote}/HEAD`,
          depth: 2,
        })
        const { oid } = await GitRefManager.resolveAgainstMap({
          ref: ref.replace(`refs/remotes/${remote}/`, ''),
          fullref: ref,
          map: httpRemote.refs,
        })
        const oids = [oid]
        for (const oid of await listObjects({ fs, cache, gitdir, oids })) {
          skipObjects.add(oid)
        }
      } catch (e) {}

      // Remove objects that we know the remote already has
      for (const oid of skipObjects) {
        objects.delete(oid)
      }
    }

    if (oid === oldoid) force = true
    if (!force) {
      // Is it a tag that already exists?
      if (
        fullRef.startsWith('refs/tags') &&
        oldoid !== '0000000000000000000000000000000000000000'
      ) {
        throw new PushRejectedError('tag-exists')
      }
      // Is it a non-fast-forward commit?
      if (
        oid !== '0000000000000000000000000000000000000000' &&
        oldoid !== '0000000000000000000000000000000000000000' &&
        !(await _isDescendent({
          fs,
          cache,
          gitdir,
          oid,
          ancestor: oldoid,
          depth: -1,
        }))
      ) {
        throw new PushRejectedError('not-fast-forward')
      }
    }
  }
  // We can only safely use capabilities that the server also understands.
  // For instance, AWS CodeCommit aborts a push if you include the `agent`!!!
  const capabilities = filterCapabilities(
    [...httpRemote.capabilities],
    ['report-status', 'side-band-64k', `agent=${pkg.agent}`]
  )
  const packstream1 = await writeReceivePackRequest({
    capabilities,
    triplets: [{ oldoid, oid, fullRef: fullRemoteRef }],
  })
  const packstream2 = _delete
    ? []
    : await _pack({
        fs,
        cache,
        gitdir,
        oids: [...objects],
      })
  const res = await GitRemoteHTTP.connect({
    http,
    onProgress,
    corsProxy,
    service: 'git-receive-pack',
    url,
    auth,
    headers,
    body: [...packstream1, ...packstream2],
  })
  const { packfile, progress } = await GitSideBand.demux(res.body)
  if (onMessage) {
    const lines = splitLines(progress)
    forAwait(lines, async line => {
      await onMessage(line)
    })
  }
  // Parse the response!
  const result = await parseReceivePackResponse(packfile)
  if (res.headers) {
    result.headers = res.headers
  }

  // Update the local copy of the remote ref
  if (
    remote &&
    result.ok &&
    result.refs[fullRemoteRef].ok &&
    !fullRef.startsWith('refs/tags')
  ) {
    // TODO: I think this should actually be using a refspec transform rather than assuming 'refs/remotes/{remote}'
    const ref = `refs/remotes/${remote}/${fullRemoteRef.replace(
      'refs/heads',
      ''
    )}`
    if (_delete) {
      await GitRefManager.deleteRef({ fs, gitdir, ref })
    } else {
      await GitRefManager.writeRef({ fs, gitdir, ref, value: oid })
    }
  }
  if (result.ok && Object.values(result.refs).every(result => result.ok)) {
    return result
  } else {
    const prettyDetails = Object.entries(result.refs)
      .filter(([k, v]) => !v.ok)
      .map(([k, v]) => `\n  - ${k}: ${v.error}`)
      .join('')
    throw new GitPushError(prettyDetails, result)
  }
}
