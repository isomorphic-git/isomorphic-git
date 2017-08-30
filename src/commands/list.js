import GitIndex from '../models/GitIndex'
import read from '../utils/read'

export default async function list ({dir}) {
  const index = GitIndex.from(await read(`${dir}/index`))
  return index.entries.map(x => x.path)
}