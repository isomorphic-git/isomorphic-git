import GitTree from '../models/GitTree'
import GitCommit from '../models/GitCommit'
import GitObjectManager from '../managers/GitObjectManager'
import GitIndexManager from '../managers/GitIndexManager'
import resolveRef from '../utils/resolveRef'
import write from '../utils/write'
import path from 'path'

export default async function commit ({ gitdir, author, committer, message, privateKey }) {
  // Fill in missing arguments with default values
  committer = committer || author
  let authorDateTime = author.date || new Date()
  let committerDateTime = committer.date || authorDateTime
  const index = await GitIndexManager.acquire(`${gitdir}/index`)
  const tree = GitTree.from(index.entries)
  const treeRef = await GitObjectManager.write({
    gitdir,
    type: 'tree',
    object: tree.toObject()
  })
  GitIndexManager.release(`${gitdir}/index`)
  const parent = await resolveRef({ gitdir, ref: 'HEAD' })
  let comm = GitCommit.from({
    tree: treeRef,
    parent: [parent],
    author: {
      name: author.name,
      email: author.email,
      timestamp: Math.floor(authorDateTime.valueOf() / 1000),
      timezoneOffset: authorDateTime.getTimezoneOffset()
    },
    committer: {
      name: committer.name,
      email: committer.email,
      timestamp: Math.floor(committerDateTime.valueOf() / 1000),
      timezoneOffset: committerDateTime.getTimezoneOffset()
    },
    message
  })
  if (privateKey) {
    comm = await comm.addSignature(privateKey)
  }
  console.log('comm =', comm)
  let oid = await GitObjectManager.write({
    gitdir,
    type: 'commit',
    object: comm.toObject()
  })
  // Update branch pointer
  const branch = await resolveRef({ gitdir, ref: 'HEAD', depth: 2 })
  await write(path.join(gitdir, branch), oid + '\n')
  return oid
}
