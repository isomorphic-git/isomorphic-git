import exists from './exists'
import read from './read'

export default async function resolveRef ({gitdir, ref}) {
  let sha
  // Is it a ref pointer?
  if (ref.startsWith('ref: ')) {
    ref = ref.slice('ref: '.length)
    sha = await read(`${gitdir}/${ref}`, {encoding: 'utf8'})
    if (sha) return resolveRef({gitdir, ref: sha.trim()})
  }
  // Is it a complete and valid SHA?
  if (ref.length === 40) {
    if (await exists(`${gitdir}/objects/${ref.slice(0,2)}/${ref.slice(2)}`)) {
      return ref
    }
  }
  // Is it a special ref?
  if (ref === 'HEAD' || ref === 'MERGE_HEAD') {
    sha = await read(`${gitdir}/${ref}`, {encoding: 'utf8'})
    if (sha) return resolveRef({gitdir, ref: sha.trim()})
  }
  // Is it a (local) branch?
  sha = await read(`${gitdir}/refs/heads/${ref}`, {encoding: 'utf8'})
  if (sha) return resolveRef({gitdir, ref: sha.trim()})
  // Is it a tag?
  sha = await read(`${gitdir}/refs/tags/${ref}`, {encoding: 'utf8'})
  if (sha) return resolveRef({gitdir, ref: sha.trim()})
  // Is it remote branch?
  sha = await read(`${gitdir}/refs/remotes/${ref}`, {encoding: 'utf8'})
  if (sha) return resolveRef({gitdir, ref: sha.trim()})
  // Do we give up?
  throw new Error(`Could not resolve reference ${ref}`)
}