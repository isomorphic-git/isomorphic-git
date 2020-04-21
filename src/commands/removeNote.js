// @ts-check
import { _commit } from '../commands/commit.js'
import { _readTree } from '../commands/readTree.js'
import { _writeTree } from '../commands/writeTree.js'
import { NotFoundError } from '../errors/NotFoundError.js'
import { GitRefManager } from '../managers/GitRefManager.js'

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {object} args.cache
 * @param {SignCallback} [args.onSign]
 * @param {string} [args.dir]
 * @param {string} [args.gitdir=join(dir,'.git')]
 * @param {string} [args.ref]
 * @param {string} args.oid
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
 *
 * @returns {Promise<string>}
 */

export async function _removeNote({
  fs,
  cache,
  onSign,
  gitdir,
  ref = 'refs/notes/commits',
  oid,
  author,
  committer,
  signingKey,
}) {
  // Get the current note commit
  let parent
  try {
    parent = await GitRefManager.resolve({ gitdir, fs, ref })
  } catch (err) {
    if (!(err instanceof NotFoundError)) {
      throw err
    }
  }

  // I'm using the "empty tree" magic number here for brevity
  const result = await _readTree({
    fs,
    gitdir,
    oid: parent || '4b825dc642cb6eb9a060e54bf8d69288fbee4904',
  })
  let tree = result.tree

  // Remove the note blob entry from the tree
  tree = tree.filter(entry => entry.path !== oid)

  // Create the new note tree
  const treeOid = await _writeTree({
    fs,
    gitdir,
    tree,
  })

  // Create the new note commit
  const commitOid = await _commit({
    fs,
    cache,
    onSign,
    gitdir,
    ref,
    tree: treeOid,
    parent: parent && [parent],
    message: `Note removed by 'isomorphic-git removeNote'\n`,
    author,
    committer,
    signingKey,
  })

  return commitOid
}
