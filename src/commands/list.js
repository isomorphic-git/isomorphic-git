import GitIndexManager from '../managers/GitIndexManager'

export default async function list ({ gitdir }) {
  const index = await GitIndexManager.acquire(`${gitdir}/index`)
  const filenames = index.entries.map(x => x.path)
  GitIndexManager.release(`${gitdir}/index`)
  return filenames
}
