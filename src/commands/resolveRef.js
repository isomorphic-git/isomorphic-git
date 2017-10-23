import { read } from '../utils'

export async function resolveRef ({ gitdir, ref, depth }) {
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
    return resolveRef({ gitdir, ref, depth })
  }
  // Is it a complete and valid SHA?
  if (ref.length === 40 && /[0-9a-f]{40}/.test(ref)) {
    return ref
  }
  // Is it a special ref?
  if (ref === 'HEAD' || ref === 'MERGE_HEAD') {
    sha = await read(`${gitdir}/${ref}`, { encoding: 'utf8' })
    if (sha) return resolveRef({ gitdir, ref: sha.trim(), depth })
  }
  // Is it a full ref?
  if (ref.startsWith('refs/')) {
    sha = await read(`${gitdir}/${ref}`, { encoding: 'utf8' })
    if (sha) return resolveRef({ gitdir, ref: sha.trim(), depth })
  }
  // Is it a (local) branch?
  sha = await read(`${gitdir}/refs/heads/${ref}`, { encoding: 'utf8' })
  if (sha) return resolveRef({ gitdir, ref: sha.trim(), depth })
  // Is it a tag?
  sha = await read(`${gitdir}/refs/tags/${ref}`, { encoding: 'utf8' })
  if (sha) return resolveRef({ gitdir, ref: sha.trim(), depth })
  // Is it remote branch?
  sha = await read(`${gitdir}/refs/remotes/${ref}`, { encoding: 'utf8' })
  if (sha) return resolveRef({ gitdir, ref: sha.trim(), depth })
  // Do we give up?
  throw new Error(`Could not resolve reference ${ref}`)
}
