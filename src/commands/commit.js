import { config } from './config'
import { GitCommit, GitTree } from '../models'
import { GitRefManager, GitObjectManager, GitIndexManager } from '../managers'
import {
  write,
  flatFileListToDirectoryStructure,
  fs as defaultfs,
  setfs
} from '../utils'
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

/**
 * Create a new commit
 * @param {GitRepo} repo - A {@link Git} object matching `{gitdir, fs}`
 * @param {Object} args - Arguments object
 * @param {string} args.message - The commit message to use.
 * @param {Object} [args.author] - The details about the commit author.
 * @param {string} [args.author.name=undefined] - Default is `user.name` config.
 * @param {string} [args.author.email=undefined] - Default is `user.email` config.
 * @param {Date} [args.author.date=new Date()] - Set the author timestamp field. Default is the current date.
 * @param {number} [args.author.timestamp=undefined] - Set the author timestamp field. This is an alternative to using `date` using an integer number of seconds since the Unix epoch instead of a JavaScript date object.
 * @param {Object} [args.committer=author] - The details about the commit committer, in the same format as the author parameter. If not specified, the author details are used.
 * @param {string} [args.privateKeys=undefined] - A PGP private key in ASCII armor format.
 * @returns {Promise<string>} - The object ID of the newly created commit.
 * @todo Move the PGP signing to a separte signCommit function for better code splitting.
 *
 * @example
 * let repo = new Git({fs, dir: '.'})
 * let sha = await commit(repo, {
 *   author: {
 *     name: 'Mr. Test',
 *     email: 'mrtest@example.com'
 *   },
 *   privateKeys: '-----BEGIN PGP PRIVATE KEY BLOCK-----...',
 *   message: 'Added the a.txt file'
 * })
 */
export async function commit (
  { gitdir, fs = defaultfs() },
  { message, author, committer, privateKeys }
) {
  setfs(fs)
  // Fill in missing arguments with default values
  if (author === undefined) author = {}
  if (author.name === undefined) {
    author.name = await config({ gitdir, path: 'user.name' })
  }
  if (author.email === undefined) {
    author.email = await config({ gitdir, path: 'user.email' })
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
      let parent = await GitRefManager.resolve({ gitdir, ref: 'HEAD' })
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
    const branch = await GitRefManager.resolve({
      gitdir,
      ref: 'HEAD',
      depth: 2
    })
    await write(path.join(gitdir, branch), oid + '\n')
  })
  return oid
}
