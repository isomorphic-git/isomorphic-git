import read from './read'

async function resolveRef ({dir, ref}) {
  let sha = await read(`${dir}/.git/refs/heads/${ref}`, {encoding: 'utf8'})
  if (sha) return sha
  sha = await read(`${dir}/.git/refs/tags/${ref}`, {encoding: 'utf8'})
  if (sha) return sha
  sha = await read(`${dir}/.git/refs/${ref}`, {encoding: 'utf8'})
  if (sha) return sha
  throw new Error(`Could not resolve reference ${ref}`)
}