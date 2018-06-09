import path from 'path'

import { GitIndexManager, GitObjectManager, GitRefManager } from '../managers'
import { FileSystem, GitCommit } from '../models'
import { constructTree, flatFileListToDirectoryStructure } from '../utils'

import { config } from './config'

/**
 * Create a new commit
 *
 * @link https://isomorphic-git.github.io/docs/commit.html
 */
export async function commit ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
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
      throw new Error(
        'Author name and email must be specified as an argument or in the .git/config file'
      )
    }
    committer = committer || author
    let authorDateTime = author.date || new Date()
    let committerDateTime = committer.date || authorDateTime
    let oid
    await GitIndexManager.acquire(
      { fs, filepath: `${gitdir}/index` },
      async function (index) {
        const inode = flatFileListToDirectoryStructure(index.entries)
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
        oid = await GitObjectManager.write({
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
