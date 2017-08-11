import exists from './exists'
import read from './read'

export default async function resolveRef ({dir, ref}) {
  let sha
  // Is it a SHA?
  if (/^[0-9a-fA-F]+$/.test(ref)) {
    // Is it a complete SHA (already dereferenced)?
    if (ref.length === 40) {
      if (await exists(`${dir}/.git/objects/${ref.slice(0,2)}/${ref.slice(2)}`)) {
        return ref.trim()
      }
    // Is it a partial SHA?
    } else if (ref.length === 7) {
      // TODO: use file globbing to match partial SHAs
    }
  }
  // Is it a (local) branch?
  sha = await read(`${dir}/.git/refs/heads/${ref}`, {encoding: 'utf8'})
  if (sha) return sha.trim()
  // Is it a tag?
  sha = await read(`${dir}/.git/refs/tags/${ref}`, {encoding: 'utf8'})
  if (sha) return sha.trim()
  // Is it remote branch?
  sha = await read(`${dir}/.git/refs/remotes/${ref}`, {encoding: 'utf8'})
  if (sha) return sha.trim()
  // Do we give up?
  throw new Error(`Could not resolve reference ${ref}`)
}