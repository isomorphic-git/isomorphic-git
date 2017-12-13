// This is a convenience wrapper for reading and writing files in the 'refs' directory.
import path from 'path'
import { FileSystem } from '../models'

export class GitRefManager {
  /* ::
  updateRemoteRefs : ({
    gitdir: string,
    remote: string,
    refs: Map<string, string>,
    symrefs: Map<string, string>
  }) => Promise<void>
  */
  static async updateRemoteRefs ({ fs: _fs, gitdir, remote, refs, symrefs }) {
    const fs = new FileSystem(_fs)
    // Validate input
    for (let value of refs.values()) {
      if (!value.match(/[0-9a-f]{40}/)) {
        throw new Error(`Unexpected ref contents: '${value}'`)
      }
    }
    // Combine refs and symrefs giving symrefs priority
    let actualRefsToWrite = new Map()
    for (let [key, value] of refs) actualRefsToWrite.set(key, value)
    for (let [key, value] of symrefs) {
      let branch = value.replace(/^refs\/heads\//, '')
      actualRefsToWrite.set(key, `ref: refs/remotes/${remote}/${branch}`)
    }
    // Update files
    const normalizeValue = value => value.trim() + '\n'
    for (let [key, value] of actualRefsToWrite) {
      // For some reason we trim these
      key = key.replace(/^refs\/heads\//, '')
      key = key.replace(/^refs\/tags\//, '')
      await fs.write(
        path.join(gitdir, 'refs', 'remotes', remote, key),
        normalizeValue(value),
        'utf8'
      )
    }
  }
  static async resolve ({ fs: _fs, gitdir, ref, depth }) {
    const fs = new FileSystem(_fs)
    if (depth !== undefined) {
      depth--
      if (depth === -1) {
        return ref
      }
    }
    let sha
    // Is it a ref pointer?
    if (ref.startsWith('ref: ')) {
      ref = ref.slice('ref: '.length)
      return GitRefManager.resolve({ fs, gitdir, ref, depth })
    }
    // Is it a complete and valid SHA?
    if (ref.length === 40 && /[0-9a-f]{40}/.test(ref)) {
      return ref
    }
    // Is it a special ref?
    if (ref === 'HEAD' || ref === 'MERGE_HEAD') {
      sha = await fs.read(`${gitdir}/${ref}`, { encoding: 'utf8' })
      if (sha) {
        return GitRefManager.resolve({ fs, gitdir, ref: sha.trim(), depth })
      }
    }
    // Is it a full ref?
    if (ref.startsWith('refs/')) {
      sha = await fs.read(`${gitdir}/${ref}`, { encoding: 'utf8' })
      if (sha) {
        return GitRefManager.resolve({ fs, gitdir, ref: sha.trim(), depth })
      }
    }
    // Is it a (local) branch?
    sha = await fs.read(`${gitdir}/refs/heads/${ref}`, { encoding: 'utf8' })
    if (sha) {
      return GitRefManager.resolve({ fs, gitdir, ref: sha.trim(), depth })
    }
    // Is it a tag?
    sha = await fs.read(`${gitdir}/refs/tags/${ref}`, { encoding: 'utf8' })
    if (sha) {
      return GitRefManager.resolve({ fs, gitdir, ref: sha.trim(), depth })
    }
    // Is it remote branch?
    sha = await fs.read(`${gitdir}/refs/remotes/${ref}`, { encoding: 'utf8' })
    if (sha) {
      return GitRefManager.resolve({ fs, gitdir, ref: sha.trim(), depth })
    }
    // Is it a packed ref? (This must be last because refs in heads have priority)
    let text = await fs.read(`${gitdir}/packed-refs`, { encoding: 'utf8' })
    if (text && text.includes(ref)) {
      let candidates = text
        .trim()
        .split('\n')
        .filter(x => x.endsWith(ref))
        .filter(x => !x.startsWith('#'))
      if (candidates.length > 1) {
        throw new Error(`Could not resolve ambiguous reference ${ref}`)
      } else if (candidates.length === 1) {
        sha = candidates[0].split(' ')[0]
        return GitRefManager.resolve({ fs, gitdir, ref: sha.trim(), depth })
      }
    }
    // Do we give up?
    throw new Error(`Could not resolve reference ${ref}`)
  }
}
