import { GitIndexManager } from '../managers'
import { fs as defaultfs, setfs } from '../utils'

export async function list ({ gitdir, fs = defaultfs() }) {
  setfs(fs)
  let filenames
  await GitIndexManager.acquire(`${gitdir}/index`, async function (index) {
    filenames = index.entries.map(x => x.path)
  })
  return filenames
}
