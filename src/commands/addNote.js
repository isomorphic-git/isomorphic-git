// @ts-check
import '../typedefs.js'

import { _commit } from '../commands/commit.js'
import { _readTree } from '../commands/readTree.js'
import { _writeTree } from '../commands/writeTree.js'
import { AlreadyExistsError } from '../errors/AlreadyExistsError.js'
import { NotFoundError } from '../errors/NotFoundError.js'
import { GitRefManager } from '../managers/GitRefManager.js'
import { _writeObject as writeObject } from '../storage/writeObject.js'

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {object} args.cache
 * @param {SignCallback} [args.onSign]
 * @param {string} args.gitdir
 * @param {string} args.ref
 * @param {string} args.oid
 * @param {string|Uint8Array} args.note
 * @param {boolean} [args.force]
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

export async function _addNote({
  fs,
  cache,
  onSign,
  gitdir,
  ref,
  oid,
  note,
  force,
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
    cache,
    gitdir,
    oid: parent || '4b825dc642cb6eb9a060e54bf8d69288fbee4904',
  })
  let tree = result.tree

  // Handle the case where a note already exists
  if (force) {
    tree = tree.filter(entry => entry.path !== oid)
  } else {
    for (const entry of tree) {
      if (entry.path === oid) {
        throw new AlreadyExistsError('note', oid)
      }
    }
  }

  // Create the note blob
  if (typeof note === 'string') {
    note = Buffer.from(note, 'utf8')
  }
  const noteOid = await writeObject({
    fs,
    gitdir,
    type: 'blob',
    object: note,
    format: 'content',
  })

  // Create the new note tree
  tree.push({ mode: '100644', path: oid, oid: noteOid, type: 'blob' })
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
    message: `Note added by 'isomorphic-git addNote'\n`,
    author,
    committer,
    signingKey,
  })

  return commitOid
}
