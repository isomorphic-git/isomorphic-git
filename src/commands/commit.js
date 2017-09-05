import GitTree from '../models/GitTree'
import GitCommit from '../models/GitCommit'
import GitObject from '../models/GitObject'
import GitIndexManager from '../managers/GitIndexManager'
import resolveRef from '../utils/resolveRef'
import write from '../utils/write'
import path from 'path'

export default async function commit ({ gitdir, author, message }) {
  const index = await GitIndexManager.acquire(`${gitdir}/index`)
  const tree = GitTree.from(index.entries)
  const treeRef = await GitObject.write({
    gitdir,
    type: 'tree',
    object: tree.toObject()
  })
  console.log(tree.render())
  GitIndexManager.release(`${gitdir}/index`)
  const parent = await resolveRef({ gitdir, ref: 'HEAD' })
  const time = new Date()
  const commit = GitCommit.from({
    tree: treeRef,
    parent: [parent],
    author: {
      name: author.name,
      email: author.email,
      timestamp: Math.floor(time.valueOf() / 1000),
      timezoneOffset: time.getTimezoneOffset()
    },
    committer: {
      name: author.name,
      email: author.email,
      timestamp: Math.floor(time.valueOf() / 1000),
      timezoneOffset: time.getTimezoneOffset()
    },
    message
  })
  console.log(commit.render())
  let oid = GitObject.write({
    gitdir,
    type: 'commit',
    object: commit.toObject()
  })
  // Update branch pointer
  const branch = await resolveRef({ gitdir, ref: 'HEAD', depth: 2 })
  await write(path.join(gitdir, branch), oid + '\n')
  return oid
}
