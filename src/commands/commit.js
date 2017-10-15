import { getConfig } from './getConfig'
import { GitCommit, GitTree } from '../models'
import { GitObjectManager, GitIndexManager } from '../managers'
import { write, resolveRef, flatFileListToDirectoryStructure } from '../utils'
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

export async function commit ({
  gitdir,
  author,
  committer,
  message,
  privateKeys
}) {
  // Fill in missing arguments with default values
  if (author === undefined) author = {}
  if (author.name === undefined) {
    author.name = await getConfig({ gitdir, path: 'user.name' })
  }
  if (author.email === undefined) {
    author.email = await getConfig({ gitdir, path: 'user.email' })
  }
  committer = committer || author
  let authorDateTime = author.date || new Date()
  let committerDateTime = committer.date || authorDateTime
  let oid
  await GitIndexManager.acquire(`${gitdir}/index`, async function (index) {
    const inode = flatFileListToDirectoryStructure(index.entries)
    const treeRef = await constructTree({ gitdir, inode })
    let parents
    try {
      let parent = await resolveRef({ gitdir, ref: 'HEAD' })
      parents = [parent]
    } catch (err) {
      // Probably an initial commit
      parents = []
    }
    let comm = GitCommit.from({
      tree: treeRef,
      parent: parents,
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
    if (privateKeys) {
      comm = await comm.sign(privateKeys)
    }
    oid = await GitObjectManager.write({
      gitdir,
      type: 'commit',
      object: comm.toObject()
    })
    // Update branch pointer
    const branch = await resolveRef({ gitdir, ref: 'HEAD', depth: 2 })
    await write(path.join(gitdir, branch), oid + '\n')
  })
  return oid
}
