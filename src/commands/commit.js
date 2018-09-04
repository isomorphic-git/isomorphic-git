import path from 'path'

import { GitIndexManager } from '../managers/GitIndexManager.js'
import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { GitCommit } from '../models/GitCommit.js'
import { E, GitError } from '../models/GitError.js'
import { GitTree } from '../models/GitTree.js'
import { writeObject } from '../storage/writeObject.js'
import { flatFileListToDirectoryStructure } from '../utils/flatFileListToDirectoryStructure.js'
import { cores } from '../utils/plugins.js'

import { config } from './config'

/**
 * Create a new commit
 *
 * @link https://isomorphic-git.github.io/docs/commit.html
 */
export async function commit ({
  core = 'default',
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  message,
  author,
  committer
}) {
  try {
    const fs = new FileSystem(_fs)
    // Fill in missing arguments with default values
    if (author === undefined) author = {}
    if (author.name === undefined) {
      author.name = await config({ fs, gitdir, path: 'user.name' })
    }
    if (author.email === undefined) {
      author.email = await config({ fs, gitdir, path: 'user.email' })
    }
    if (author.name === undefined || author.email === undefined) {
      throw new GitError(E.MissingAuthorError)
    }
    if (message === undefined) {
      throw new GitError(E.MissingRequiredParameterError, {
        function: 'commit',
        parameter: 'message'
      })
    }
    committer = committer || author
    let authorDateTime = author.date || new Date()
    let committerDateTime = committer.date || authorDateTime
    let oid
    await GitIndexManager.acquire(
      { fs, filepath: `${gitdir}/index` },
      async function (index) {
        const inodes = flatFileListToDirectoryStructure(index.entries)
        const inode = inodes.get('.')
        const treeRef = await constructTree({ fs, gitdir, inode })
        let parents
        try {
          let parent = await GitRefManager.resolve({ fs, gitdir, ref: 'HEAD' })
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
              author.timestamp !== undefined && author.timestamp !== null
                ? author.timestamp
                : Math.floor(authorDateTime.valueOf() / 1000),
            timezoneOffset:
              author.timezoneOffset !== undefined &&
              author.timezoneOffset !== null
                ? author.timezoneOffset
                : new Date().getTimezoneOffset()
          },
          committer: {
            name: committer.name,
            email: committer.email,
            timestamp:
              committer.timestamp !== undefined && committer.timestamp !== null
                ? committer.timestamp
                : Math.floor(committerDateTime.valueOf() / 1000),
            timezoneOffset:
              committer.timezoneOffset !== undefined &&
              committer.timezoneOffset !== null
                ? committer.timezoneOffset
                : new Date().getTimezoneOffset()
          },
          message
        })
        oid = await writeObject({
          fs,
          gitdir,
          type: 'commit',
          object: comm.toObject()
        })
        // Update branch pointer
        const branch = await GitRefManager.resolve({
          fs,
          gitdir,
          ref: 'HEAD',
          depth: 2
        })
        await fs.write(path.join(gitdir, branch), oid + '\n')
      }
    )
    return oid
  } catch (err) {
    err.caller = 'git.commit'
    throw err
  }
}

async function constructTree ({ fs, gitdir, inode }) {
  // use depth first traversal
  let children = inode.children
  for (let inode of children) {
    if (inode.type === 'tree') {
      inode.metadata.mode = '040000'
      inode.metadata.oid = await constructTree({ fs, gitdir, inode })
    }
  }
  let entries = children.map(inode => ({
    mode: inode.metadata.mode,
    path: inode.basename,
    oid: inode.metadata.oid,
    type: inode.type
  }))
  const tree = GitTree.from(entries)
  let oid = await writeObject({
    fs,
    gitdir,
    type: 'tree',
    object: tree.toObject()
  })
  return oid
}
