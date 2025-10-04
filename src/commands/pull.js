// @ts-check
import { _branch } from '../commands/branch.js'
import { _checkout } from '../commands/checkout.js'
import { _currentBranch } from '../commands/currentBranch.js'
import { _fetch } from '../commands/fetch.js'
import { _merge } from '../commands/merge.js'
import { MissingParameterError } from '../errors/MissingParameterError.js'
import { GitConfigManager } from '../managers/GitConfigManager.js'
import { GitRefManager } from '../managers/GitRefManager.js'

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
 * @param {string} args.dir
 * @param {string} args.gitdir
 * @param {string} args.ref
 * @param {string} [args.url]
 * @param {string} [args.remote]
 * @param {string} [args.remoteRef]
 * @param {boolean} [args.prune]
 * @param {boolean} [args.pruneTags]
 * @param {string} [args.corsProxy]
 * @param {boolean} args.singleBranch
 * @param {boolean} args.fastForward
 * @param {boolean} args.fastForwardOnly
 * @param {Object<string, string>} [args.headers]
 * @param {Object} args.author
 * @param {string} args.author.name
 * @param {string} args.author.email
 * @param {number} args.author.timestamp
 * @param {number} args.author.timezoneOffset
 * @param {Object} args.committer
 * @param {string} args.committer.name
 * @param {string} args.committer.email
 * @param {number} args.committer.timestamp
 * @param {number} args.committer.timezoneOffset
 * @param {string} [args.signingKey]
 *
 * @returns {Promise<void>} Resolves successfully when pull operation completes
 *
 */
export async function _pull({
  fs,
  cache,
  http,
  onProgress,
  onMessage,
  onAuth,
  onAuthSuccess,
  onAuthFailure,
  dir,
  gitdir,
  ref,
  url,
  remote,
  remoteRef,
  prune,
  pruneTags,
  fastForward,
  fastForwardOnly,
  corsProxy,
  singleBranch,
  headers,
  author,
  committer,
  signingKey,
}) {
  try {
    // Helper: normalize branch name (strip refs/heads/ prefix)
    const normalizeBranchShort = v => {
      if (!v) return null
      return v.startsWith('refs/heads/') ? v.slice('refs/heads/'.length) : v
    }

    // Helper: read refs/remotes/<remote>/HEAD file if it exists
    const tryReadRemoteHeadFile = async (fs, gitdir, remoteName) => {
      const path = `${gitdir}/refs/remotes/${remoteName}/HEAD`
      try {
        let raw
        // Try different fs APIs
        if (typeof fs.read === 'function') {
          raw = await fs.read(path, 'utf8')
        } else if (typeof fs.readFile === 'function') {
          raw = await fs.readFile(path, 'utf8')
        } else {
          return null
        }

        if (!raw) return null
        const txt = String(raw).trim()

        // Canonical git stores: "ref: refs/remotes/origin/main"
        if (txt.startsWith('ref: ')) {
          return txt.slice(5).trim()
        }
        // Sometimes it might directly contain the ref name or oid
        return txt
      } catch (e) {
        return null
      }
    }

    // Helper: resolve ref to OID (handles both refs and OIDs)
    const resolveToOid = async maybeRefOrOid => {
      if (!maybeRefOrOid) return null
      // Detect SHA-1 (40 hex chars)
      if (/^[0-9a-f]{40}$/i.test(maybeRefOrOid)) return maybeRefOrOid
      // Try to resolve as ref
      try {
        const oid = await GitRefManager.resolve({
          fs,
          gitdir,
          ref: maybeRefOrOid,
        })
        return oid
      } catch (e) {
        return null
      }
    }

    let isEmptyClone = false
    let branchToCreate = null
    const originalRef = ref

    // Detect empty clone by checking if current branch exists
    // This needs to happen regardless of whether ref is provided
    try {
      const head = await _currentBranch({ fs, gitdir })
      if (!head) {
        // currentBranch returned null/undefined - empty clone
        isEmptyClone = true
      }
    } catch (err) {
      // currentBranch threw error (NotFoundError) - empty clone
      isEmptyClone = true
    }

    // If ref is undefined and not empty clone, try to get current branch for ref
    if (!ref && !isEmptyClone) {
      try {
        const head = await _currentBranch({ fs, gitdir })
        if (head) {
          ref = head
        }
      } catch (err) {
        // Shouldn't happen since we checked above, but handle it
        isEmptyClone = true
      }
    }

    // For empty clone, determine branch name before fetch if possible
    if (isEmptyClone) {
      const remoteName = remote || 'origin'

      // If ref was explicitly provided by user, use it
      if (originalRef) {
        branchToCreate = normalizeBranchShort(originalRef)
        ref = originalRef
      } else {
        // Try to read remote HEAD to determine default branch
        const remoteHeadRef = await tryReadRemoteHeadFile(
          fs,
          gitdir,
          remoteName
        )
        if (
          remoteHeadRef &&
          remoteHeadRef.startsWith(`refs/remotes/${remoteName}/`)
        ) {
          branchToCreate = remoteHeadRef.slice(
            `refs/remotes/${remoteName}/`.length
          )
        } else if (remoteHeadRef && remoteHeadRef.startsWith('refs/heads/')) {
          branchToCreate = normalizeBranchShort(remoteHeadRef)
        } else if (remoteRef) {
          // User specified remoteRef explicitly
          branchToCreate = normalizeBranchShort(remoteRef)
        } else {
          // Cannot determine branch - this matches canonical Git behavior
          throw new MissingParameterError(
            'Cannot determine which branch to pull. ' +
              'Please specify ref or remoteRef parameter, or ensure the remote has a default branch configured.'
          )
        }

        ref = branchToCreate
      }
    }

    // Perform fetch
    const { fetchHead, fetchHeadDescription } = await _fetch({
      fs,
      cache,
      http,
      onProgress,
      onMessage,
      onAuth,
      onAuthSuccess,
      onAuthFailure,
      gitdir,
      corsProxy,
      ref,
      url,
      remote,
      remoteRef,
      singleBranch,
      headers,
      prune,
      pruneTags,
    })

    // Handle empty clone scenario
    if (isEmptyClone) {
      const remoteName = remote || 'origin'

      // If we still don't have a branch name, try after fetch
      // (fetch might have created refs/remotes/origin/HEAD)
      if (!branchToCreate) {
        const remoteHeadRef = await tryReadRemoteHeadFile(
          fs,
          gitdir,
          remoteName
        )
        if (
          remoteHeadRef &&
          remoteHeadRef.startsWith(`refs/remotes/${remoteName}/`)
        ) {
          branchToCreate = remoteHeadRef.slice(
            `refs/remotes/${remoteName}/`.length
          )
        } else if (remoteHeadRef && remoteHeadRef.startsWith('refs/heads/')) {
          branchToCreate = normalizeBranchShort(remoteHeadRef)
        } else if (remoteRef) {
          branchToCreate = normalizeBranchShort(remoteRef)
        } else {
          // Still can't determine - fail like canonical Git would
          throw new MissingParameterError(
            'Cannot determine which branch to pull from remote. ' +
              'The remote does not have a default branch configured.'
          )
        }
      }

      // Determine target OID for the new branch
      let targetOid = null

      // Check if fetchHead is already an OID
      if (typeof fetchHead === 'string' && /^[0-9a-f]{40}$/i.test(fetchHead)) {
        targetOid = fetchHead
      } else {
        // Try to resolve fetchHead or the remote branch
        targetOid =
          (await resolveToOid(fetchHead)) ||
          (await resolveToOid(
            `refs/remotes/${remoteName}/${branchToCreate}`
          )) ||
          (await resolveToOid(`refs/heads/${branchToCreate}`))
      }

      if (!targetOid) {
        throw new Error(
          `Could not determine commit OID for creating local branch ${branchToCreate}`
        )
      }

      // Create local branch pointing to the fetched commit
      await _branch({
        fs,
        gitdir,
        ref: branchToCreate,
        object: targetOid,
        checkout: false,
        force: false,
      })

      // Set up branch tracking configuration (matches canonical Git)
      try {
        const config = await GitConfigManager.get({ fs, gitdir })

        // Set the branch tracking config
        config.set(`branch.${branchToCreate}.remote`, remoteName)
        config.set(
          `branch.${branchToCreate}.merge`,
          `refs/heads/${branchToCreate}`
        )

        // Save the config back to disk
        await GitConfigManager.save({ fs, gitdir, config })
      } catch (err) {
        // Fail loudly if we can't set tracking config
        throw new Error(
          `Failed to write branch tracking config for ${branchToCreate}: ${err.message ||
            err}`
        )
      }

      // Checkout the new branch
      await _checkout({
        fs,
        cache,
        onProgress,
        dir,
        gitdir,
        ref: branchToCreate,
        remote,
        noCheckout: false,
      })

      return
    }

    // Standard merge flow for existing branches
    try {
      await _merge({
        fs,
        cache,
        gitdir,
        ours: ref,
        theirs: fetchHead,
        fastForward,
        fastForwardOnly,
        message: `Merge ${fetchHeadDescription}`,
        author,
        committer,
        signingKey,
        dryRun: false,
        noUpdateBranch: false,
      })
    } catch (err) {
      // If merge fails because local branch doesn't exist, create it
      if (err.code === 'ResolveRefError' || err.code === 'NotFoundError') {
        await _branch({
          fs,
          gitdir,
          ref,
          object: fetchHead,
          checkout: false,
          force: false,
        })
      } else {
        throw err
      }
    }

    // Checkout the branch
    await _checkout({
      fs,
      cache,
      onProgress,
      dir,
      gitdir,
      ref,
      remote,
      noCheckout: false,
    })
  } catch (err) {
    err.caller = 'git.pull'
    throw err
  }
}
