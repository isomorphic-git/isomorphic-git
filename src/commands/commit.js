// @ts-check
import { GitIndexManager } from '../managers/GitIndexManager.js'
import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { GitCommit } from '../models/GitCommit.js'
import { E, GitError } from '../models/GitError.js'
import { GitTree } from '../models/GitTree.js'
import { writeObject } from '../storage/writeObject.js'
import { flatFileListToDirectoryStructure } from '../utils/flatFileListToDirectoryStructure.js'
import { join } from '../utils/join.js'
import { normalizeAuthorObject } from '../utils/normalizeAuthorObject.js'
import { cores } from '../utils/plugins.js'

/**
 * Create a new commit
 *
 * @param {Object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {FileSystem} [args.fs] - [deprecated] The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.message - The commit message to use.
 * @param {Object} [args.author] - The details about the author.
 * @param {string} [args.author.name] - Default is `user.name` config.
 * @param {string} [args.author.email] - Default is `user.email` config.
 * @param {string} [args.author.date] - Set the author timestamp field. Default is the current date.
 * @param {string} [args.author.timestamp] - Set the author timestamp field. This is an alternative to using `date` using an integer number of seconds since the Unix epoch instead of a JavaScript date object.
 * @param {string} [args.author.timezoneOffset] - Set the author timezone offset field. This is the difference, in minutes, from the current timezone to UTC. Default is `(new Date()).getTimezoneOffset()`.
 * @param {Object} [args.committer = author] - The details about the commit committer, in the same format as the author parameter. If not specified, the author details are used.
 * @param {string} [args.signingKey] - Sign the tag object using this private PGP key.
 *
 * @returns {Promise<string>} Resolves successfully with the SHA-1 object id of the newly created commit.
 *
 * @example
 * let sha = await git.commit({
 *   dir: '$input((/))',
 *   author: {
 *     name: '$input((Mr. Test))',
 *     email: '$input((mrtest@example.com))'
 *   },
 *   message: '$input((Added the a.txt file))'
 * })
 * console.log(sha)
 *
 */
export async function commit ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  message,
  author,
  committer,
  signingKey
}) {
  try {
    const fs = new FileSystem(_fs)

    if (message === undefined) {
      throw new GitError(E.MissingRequiredParameterError, {
        function: 'commit',
        parameter: 'message'
      })
    }

    // Fill in missing arguments with default values
    author = await normalizeAuthorObject({ fs, gitdir, author })
    if (author === undefined) {
      throw new GitError(E.MissingAuthorError)
    }

    committer = Object.assign({}, committer || author)
    // Match committer's date to author's one, if omitted
    committer.date = committer.date || author.date
    committer = await normalizeAuthorObject({ fs, gitdir, author: committer })
    if (committer === undefined) {
      throw new GitError(E.MissingCommitterError)
    }

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
          author,
          committer,
          message
        })
        if (signingKey) {
          let pgp = cores.get(core).get('pgp')
          comm = await GitCommit.sign(comm, pgp, signingKey)
        }
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
        await fs.write(join(gitdir, branch), oid + '\n')
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
