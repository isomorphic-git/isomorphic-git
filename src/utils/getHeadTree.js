import { GitObjectManager, GitRefManager } from '../managers'
import { GitCommit, GitTree } from '../models'

export async function getHeadTree ({ fs, gitdir }) {
  // Get the tree from the HEAD commit.
  let oid = await GitRefManager.resolve({ fs, gitdir, ref: 'HEAD' })
  let { object: cobject } = await GitObjectManager.read({ fs, gitdir, oid })
  let commit = GitCommit.from(cobject)
  let { object: tobject } = await GitObjectManager.read({
    fs,
    gitdir,
    oid: commit.parseHeaders().tree
  })
  let tree = GitTree.from(tobject).entries()
  return tree
}
