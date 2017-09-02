import GitIndexManager from '../managers/GitIndexManager'

export default async function remove ({gitdir, filepath}) {
  const index = await GitIndexManager.acquire(`${gitdir}/index`)
  index.delete({filepath})
  GitIndexManager.release(`${gitdir}/index`)
  return // TODO: return oid?
}