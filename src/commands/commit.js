import GitTree from '../models/GitTree'
import GitCommit from '../models/GitCommit'
import GitObjectManager from '../managers/GitObjectManager'
import GitIndexManager from '../managers/GitIndexManager'
import resolveRef from '../utils/resolveRef'
import flatFileListToDirectoryStructure from '../utils/flatFileListToDirectoryStructure'
import write from '../utils/write'
import path from 'path'

async function constructTree ({ gitdir, inode }) /*: string */ {
  // use depth first traversal
  let children = inode.children
  for (let inode of children) {
    if (inode.type === 'tree') {
      inode.metadata.mode = '040000'
      inode.metadata.oid = await constructTree({ gitdir, inode })
    }
  }
  let entries = children.map(inode => ({
    mode: inode.metadata.mode,
    path: inode.basename,
    oid: inode.metadata.oid,
    type: inode.type
  }))
  const tree = GitTree.from(entries)
  let oid = await GitObjectManager.write({
    gitdir,
    type: 'tree',
    object: tree.toObject()
  })
  return oid
}

export default async function commit ({
  gitdir,
  author,
  committer,
  message,
  privateKey
}) {
  // Fill in missing arguments with default values
  committer = committer || author
  let authorDateTime = author.date || new Date()
  let committerDateTime = committer.date || authorDateTime
  const index = await GitIndexManager.acquire(`${gitdir}/index`)
  const inode = flatFileListToDirectoryStructure(index.entries)
  const treeRef = await constructTree({ gitdir, inode })
  GitIndexManager.release(`${gitdir}/index`)
  const parent = await resolveRef({ gitdir, ref: 'HEAD' })
  let comm = GitCommit.from({
    tree: treeRef,
    parent: [parent],
    author: {
      name: author.name,
      email: author.email,
      timestamp:
        author.timestamp || Math.floor(authorDateTime.valueOf() / 1000),
      timezoneOffset: author.timezoneOffset || 0
    },
    committer: {
      name: committer.name,
      email: committer.email,
      timestamp:
        committer.timestamp || Math.floor(committerDateTime.valueOf() / 1000),
      timezoneOffset: committer.timezoneOffset || 0
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
