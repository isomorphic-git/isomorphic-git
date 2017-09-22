import GitIndexManager from '../managers/GitIndexManager'

export async function remove ({ gitdir, filepath }) {
  await GitIndexManager.acquire(`${gitdir}/index`, async function (index) {
    index.delete({ filepath })
  })
  // TODO: return oid?
}
