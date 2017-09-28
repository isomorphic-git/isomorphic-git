import { GitIndexManager } from './managers'

export async function remove ({ gitdir, filepath }) {
  await GitIndexManager.acquire(`${gitdir}/index`, async function (index) {
    index.delete({ filepath })
  })
  // TODO: return oid?
}
