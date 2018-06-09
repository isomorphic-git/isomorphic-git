import { GitObjectManager } from '../managers'
import { GitCommit, GitTree } from '../models'

export async function resolveTree ({ fs, gitdir, oid }) {
  let { type, object } = await GitObjectManager.read({ fs, gitdir, oid })
  // Resolve commits to trees
  if (type === 'commit') {
    oid = GitCommit.from(object).parse().tree
    let result = await GitObjectManager.read({ fs, gitdir, oid })
    type = result.type
    object = result.object
  }
  if (type !== 'tree') {
    throw new Error(`Could not resolve ${oid} to a tree`)
  }
  return { tree: GitTree.from(object), oid }
}
