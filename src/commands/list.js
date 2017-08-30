import GitIndexManager from '../managers/GitIndexManager'

export default async function list ({dir}) {
  const index = await GitIndexManager.acquire(`${dir}/.git/index`)
  const filenames = index.entries.map(x => x.path)
  GitIndexManager.release(`${dir}/.git/index`)
  return filenames
}