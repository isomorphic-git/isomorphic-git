// This is a convenience wrapper for reading and writing files in the 'refs' directory.
import AsyncLock from 'async-lock'

import { InvalidOidError } from '../errors/InvalidOidError.js'
import { NoRefspecError } from '../errors/NoRefspecError.js'
import { NotFoundError } from '../errors/NotFoundError.js'
import { GitPackedRefs } from '../models/GitPackedRefs.js'
import { GitRefSpecSet } from '../models/GitRefSpecSet.js'
import { compareRefNames } from '../utils/compareRefNames.js'
import { join } from '../utils/join.js'

import { GitConfigManager } from './GitConfigManager'

// @see https://git-scm.com/docs/git-rev-parse.html#_specifying_revisions
const refpaths = ref => [
  `${ref}`,
  `refs/${ref}`,
  `refs/tags/${ref}`,
  `refs/heads/${ref}`,
  `refs/remotes/${ref}`,
  `refs/remotes/${ref}/HEAD`,
]

// @see https://git-scm.com/docs/gitrepository-layout
const GIT_FILES = ['config', 'description', 'index', 'shallow', 'commondir']

let lock

async function acquireLock(ref, callback) {
  if (lock === undefined) lock = new AsyncLock()
  return lock.acquire(ref, callback)
}

export class GitRefManager {
  static async updateRemoteRefs({
    fs,
    gitdir,
    remote,
    refs,
    symrefs,
    tags,
    refspecs = undefined,
    prune = false,
    pruneTags = false,
  }) {
    // Validate input
    for (const value of refs.values()) {
      if (!value.match(/[0-9a-f]{40}/)) {
        throw new InvalidOidError(value)
      }
    }
    const config = await GitConfigManager.get({ fs, gitdir })
    if (!refspecs) {
      refspecs = await config.getall(`remote.${remote}.fetch`)
      if (refspecs.length === 0) {
        throw new NoRefspecError(remote)
      }
      // There's some interesting behavior with HEAD that doesn't follow the refspec.
      refspecs.unshift(`+HEAD:refs/remotes/${remote}/HEAD`)
    }
    const refspec = GitRefSpecSet.from(refspecs)
    const actualRefsToWrite = new Map()
    // Delete all current tags if the pruneTags argument is true.
    if (pruneTags) {
      const tags = await GitRefManager.listRefs({
        fs,
        gitdir,
        filepath: 'refs/tags',
      })
      await GitRefManager.deleteRefs({
        fs,
        gitdir,
        refs: tags.map(tag => `refs/tags/${tag}`),
      })
    }
    // Add all tags if the fetch tags argument is true.
    if (tags) {
      for (const serverRef of refs.keys()) {
        if (serverRef.startsWith('refs/tags') && !serverRef.endsWith('^{}')) {
          // Git's behavior is to only fetch tags that do not conflict with tags already present.
          if (!(await GitRefManager.exists({ fs, gitdir, ref: serverRef }))) {
            // Always use the object id of the tag itself, and not the peeled object id.
            const oid = refs.get(serverRef)
            actualRefsToWrite.set(serverRef, oid)
          }
        }
      }
    }
    // Combine refs and symrefs giving symrefs priority
    const refTranslations = refspec.translate([...refs.keys()])
    for (const [serverRef, translatedRef] of refTranslations) {
      const value = refs.get(serverRef)
      actualRefsToWrite.set(translatedRef, value)
    }
    const symrefTranslations = refspec.translate([...symrefs.keys()])
    for (const [serverRef, translatedRef] of symrefTranslations) {
      const value = symrefs.get(serverRef)
      const symtarget = refspec.translateOne(value)
      if (symtarget) {
        actualRefsToWrite.set(translatedRef, `ref: ${symtarget}`)
      }
    }
    // If `prune` argument is true, clear out the existing local refspec roots
    const pruned = []
    if (prune) {
      for (const filepath of refspec.localNamespaces()) {
        const refs = (
          await GitRefManager.listRefs({
            fs,
            gitdir,
            filepath,
          })
        ).map(file => `${filepath}/${file}`)
        for (const ref of refs) {
          if (!actualRefsToWrite.has(ref)) {
            pruned.push(ref)
          }
        }
      }
      if (pruned.length > 0) {
        await GitRefManager.deleteRefs({ fs, gitdir, refs: pruned })
      }
    }
    // Update files
    // TODO: For large repos with a history of thousands of pull requests
    // (i.e. gitlab-ce) it would be vastly more efficient to write them
    // to .git/packed-refs.
    // The trick is to make sure we a) don't write a packed ref that is
    // already shadowed by a loose ref and b) don't loose any refs already
    // in packed-refs. Doing this efficiently may be difficult. A
    // solution that might work is
    // a) load the current packed-refs file
    // b) add actualRefsToWrite, overriding the existing values if present
    // c) enumerate all the loose refs currently in .git/refs/remotes/${remote}
    // d) overwrite their value with the new value.
    // Examples of refs we need to avoid writing in loose format for efficieny's sake
    // are .git/refs/remotes/origin/refs/remotes/remote_mirror_3059
    // and .git/refs/remotes/origin/refs/merge-requests
    for (const [key, value] of actualRefsToWrite) {
      await acquireLock(key, async () =>
        fs.write(join(gitdir, key), `${value.trim()}\n`, 'utf8')
      )
    }
    return { pruned }
  }

  // TODO: make this less crude?
  static async writeRef({ fs, gitdir, ref, value }) {
    // Validate input
    if (!value.match(/[0-9a-f]{40}/)) {
      throw new InvalidOidError(value)
    }
    await acquireLock(ref, async () =>
      fs.write(join(gitdir, ref), `${value.trim()}\n`, 'utf8')
    )
  }

  static async writeSymbolicRef({ fs, gitdir, ref, value }) {
    await acquireLock(ref, async () =>
      fs.write(join(gitdir, ref), 'ref: ' + `${value.trim()}\n`, 'utf8')
    )
  }

  static async deleteRef({ fs, gitdir, ref }) {
    return GitRefManager.deleteRefs({ fs, gitdir, refs: [ref] })
  }

  static async deleteRefs({ fs, gitdir, refs }) {
    // Delete regular ref
    await Promise.all(refs.map(ref => fs.rm(join(gitdir, ref))))
    // Delete any packed ref
    let text = await acquireLock('packed-refs', async () =>
      fs.read(`${gitdir}/packed-refs`, { encoding: 'utf8' })
    )
    const packed = GitPackedRefs.from(text)
    const beforeSize = packed.refs.size
    for (const ref of refs) {
      if (packed.refs.has(ref)) {
        packed.delete(ref)
      }
    }
    if (packed.refs.size < beforeSize) {
      text = packed.toString()
      await acquireLock('packed-refs', async () =>
        fs.write(`${gitdir}/packed-refs`, text, { encoding: 'utf8' })
      )
    }
  }

  /**
   * @param {object} args
   * @param {import('../models/FileSystem.js').FileSystem} args.fs
   * @param {string} args.gitdir
   * @param {string} args.ref
   * @param {number} [args.depth]
   * @returns {Promise<string>}
   */
  static async resolve({ fs, gitdir, ref, depth = undefined }) {
    if (depth !== undefined) {
      depth--
      if (depth === -1) {
        return ref
      }
    }

    // Is it a ref pointer?
    if (ref.startsWith('ref: ')) {
      ref = ref.slice('ref: '.length)
      return GitRefManager.resolve({ fs, gitdir, ref, depth })
    }
    // Is it a complete and valid SHA?
    if (ref.length === 40 && /[0-9a-f]{40}/.test(ref)) {
      return ref
    }
    // We need to alternate between the file system and the packed-refs
    const packedMap = await GitRefManager.packedRefs({ fs, gitdir })
    // Look in all the proper paths, in this order
    const allpaths = refpaths(ref).filter(p => !GIT_FILES.includes(p)) // exclude git system files (#709)

    for (const ref of allpaths) {
      const sha = await acquireLock(
        ref,
        async () =>
          (await fs.read(`${gitdir}/${ref}`, { encoding: 'utf8' })) ||
          packedMap.get(ref)
      )
      if (sha) {
        return GitRefManager.resolve({ fs, gitdir, ref: sha.trim(), depth })
      }
    }
    // Do we give up?
    throw new NotFoundError(ref)
  }

  static async exists({ fs, gitdir, ref }) {
    try {
      await GitRefManager.expand({ fs, gitdir, ref })
      return true
    } catch (err) {
      return false
    }
  }

  static async expand({ fs, gitdir, ref }) {
    // Is it a complete and valid SHA?
    if (ref.length === 40 && /[0-9a-f]{40}/.test(ref)) {
      return ref
    }
    // We need to alternate between the file system and the packed-refs
    const packedMap = await GitRefManager.packedRefs({ fs, gitdir })
    // Look in all the proper paths, in this order
    const allpaths = refpaths(ref)
    for (const ref of allpaths) {
      const refExists = await acquireLock(ref, async () =>
        fs.exists(`${gitdir}/${ref}`)
      )
      if (refExists) return ref
      if (packedMap.has(ref)) return ref
    }
    // Do we give up?
    throw new NotFoundError(ref)
  }

  static async expandAgainstMap({ ref, map }) {
    // Look in all the proper paths, in this order
    const allpaths = refpaths(ref)
    for (const ref of allpaths) {
      if (await map.has(ref)) return ref
    }
    // Do we give up?
    throw new NotFoundError(ref)
  }

  static resolveAgainstMap({ ref, fullref = ref, depth = undefined, map }) {
    if (depth !== undefined) {
      depth--
      if (depth === -1) {
        return { fullref, oid: ref }
      }
    }
    // Is it a ref pointer?
    if (ref.startsWith('ref: ')) {
      ref = ref.slice('ref: '.length)
      return GitRefManager.resolveAgainstMap({ ref, fullref, depth, map })
    }
    // Is it a complete and valid SHA?
    if (ref.length === 40 && /[0-9a-f]{40}/.test(ref)) {
      return { fullref, oid: ref }
    }
    // Look in all the proper paths, in this order
    const allpaths = refpaths(ref)
    for (const ref of allpaths) {
      const sha = map.get(ref)
      if (sha) {
        return GitRefManager.resolveAgainstMap({
          ref: sha.trim(),
          fullref: ref,
          depth,
          map,
        })
      }
    }
    // Do we give up?
    throw new NotFoundError(ref)
  }

  static async packedRefs({ fs, gitdir }) {
    const text = await acquireLock('packed-refs', async () =>
      fs.read(`${gitdir}/packed-refs`, { encoding: 'utf8' })
    )
    const packed = GitPackedRefs.from(text)
    return packed.refs
  }

  // List all the refs that match the `filepath` prefix
  static async listRefs({ fs, gitdir, filepath }) {
    const packedMap = GitRefManager.packedRefs({ fs, gitdir })
    let files = null
    try {
      files = await fs.readdirDeep(`${gitdir}/${filepath}`)
      files = files.map(x => x.replace(`${gitdir}/${filepath}/`, ''))
    } catch (err) {
      files = []
    }

    for (let key of (await packedMap).keys()) {
      // filter by prefix
      if (key.startsWith(filepath)) {
        // remove prefix
        key = key.replace(filepath + '/', '')
        // Don't include duplicates; the loose files have precedence anyway
        if (!files.includes(key)) {
          files.push(key)
        }
      }
    }
    // since we just appended things onto an array, we need to sort them now
    files.sort(compareRefNames)
    return files
  }

  static async listBranches({ fs, gitdir, remote }) {
    if (remote) {
      return GitRefManager.listRefs({
        fs,
        gitdir,
        filepath: `refs/remotes/${remote}`,
      })
    } else {
      return GitRefManager.listRefs({ fs, gitdir, filepath: `refs/heads` })
    }
  }

  static async listTags({ fs, gitdir }) {
    const tags = await GitRefManager.listRefs({
      fs,
      gitdir,
      filepath: `refs/tags`,
    })
    return tags.filter(x => !x.endsWith('^{}'))
  }
}
