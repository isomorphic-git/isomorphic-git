import { GitIndexManager } from '../managers'
import { fs as defaultfs, setfs } from '../utils'

export async function remove ({ gitdir, fs = defaultfs() }, { filepath }) {
  setfs(fs)
  await GitIndexManager.acquire(`${gitdir}/index`, async function (index) {
    index.delete({ filepath })
  })
  // TODO: return oid?
}
