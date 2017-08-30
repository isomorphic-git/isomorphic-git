import GitIndexManager from '../managers/GitIndexManager'

export default async function remove ({dir, filepath}) {
  const index = await GitIndexManager.acquire(`${dir}/.git/index`)
  index.delete(filepath)
  GitIndexManager.release(`${dir}/.git/index`)
  return // TODO: return oid?
}