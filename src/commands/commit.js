// @ts-check
import '../typedefs.js'

import { GitIndexManager } from '../managers/GitIndexManager.js'
import { GitRefManager } from '../managers/GitRefManager.js'
import { GitCommit } from '../models/GitCommit.js'
import { GitTree } from '../models/GitTree.js'
import { _writeObject as writeObject } from '../storage/writeObject.js'
import { flatFileListToDirectoryStructure } from '../utils/flatFileListToDirectoryStructure.js'

/**
 *
 * @param {Object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {object} args.cache
 * @param {SignCallback} [args.onSign]
 * @param {string} args.gitdir
 * @param {string} args.message
 * @param {Object} args.author
 * @param {string} args.author.name
 * @param {string} args.author.email
 * @param {number} args.author.timestamp
 * @param {number} args.author.timezoneOffset
 * @param {Object} args.committer
 * @param {string} args.committer.name
 * @param {string} args.committer.email
 * @param {number} args.committer.timestamp
 * @param {number} args.committer.timezoneOffset
 * @param {string} [args.signingKey]
 * @param {boolean} [args.dryRun = false]
 * @param {boolean} [args.noUpdateBranch = false]
 * @param {string} [args.ref]
 * @param {string[]} [args.parent]
 * @param {string} [args.tree]
 *
 * @returns {Promise<string>} Resolves successfully with the SHA-1 object id of the newly created commit.
 */
export async function _commit({
  fs,
  cache,
  onSign,
  gitdir,
  message,
  author,
  committer,
  signingKey,
  dryRun = false,
  noUpdateBranch = false,
  ref,
  parent,
  tree,
}) {
  if (!ref) {
    ref = await GitRefManager.resolve({
      fs,
      gitdir,
      ref: 'HEAD',
      depth: 2,
    })
  }

  return GitIndexManager.acquire(
    { fs, gitdir, cache, allowUnmerged: false },
    async function(index) {
      const inodes = flatFileListToDirectoryStructure(index.entries)
      const inode = inodes.get('.')
      if (!tree) {
        tree = await constructTree({ fs, gitdir, inode, dryRun })
      }
      if (!parent) {
        try {
          parent = [
            await GitRefManager.resolve({
              fs,
              gitdir,
              ref,
            }),
          ]
        } catch (err) {
          // Probably an initial commit
          parent = []
        }
      } else {
        // ensure that the parents are oids, not refs
        parent = await Promise.all(
          parent.map(p => {
            return GitRefManager.resolve({ fs, gitdir, ref: p })
          })
        )
      }

      let comm = GitCommit.from({
        tree,
        parent,
        author,
        committer,
        message,
      })
      if (signingKey) {
        comm = await GitCommit.sign(comm, onSign, signingKey)
      }
      const oid = await writeObject({
        fs,
        gitdir,
        type: 'commit',
        object: comm.toObject(),
        dryRun,
      })
      if (!noUpdateBranch && !dryRun) {
        // Update branch pointer
        await GitRefManager.writeRef({
          fs,
          gitdir,
          ref,
          value: oid,
        })
      }
      return oid
    }
  )
}

async function constructTree({ fs, gitdir, inode, dryRun }) {
  // use depth first traversal
  const children = inode.children
  for (const inode of children) {
    if (inode.type === 'tree') {
      inode.metadata.mode = '040000'
      inode.metadata.oid = await constructTree({ fs, gitdir, inode, dryRun })
    }
  }
  const entries = children.map(inode => ({
    mode: inode.metadata.mode,
    path: inode.basename,
    oid: inode.metadata.oid,
    type: inode.type,
  }))
  const tree = GitTree.from(entries)
  const oid = await writeObject({
    fs,
    gitdir,
    type: 'tree',
    object: tree.toObject(),
    dryRun,
  })
  return oid
}
