// @ts-check
import '../commands/typedefs.js'

import { commit } from '../commands/commit.js'
import { readTree } from '../commands/readTree.js'
import { writeBlob } from '../commands/writeBlob.js'
import { writeTree } from '../commands/writeTree.js'
import { GitRefManager } from '../managers/GitRefManager.js'
import { E, GitError } from '../models/GitError.js'

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {SignCallback} [args.sign]
 * @param {string} args.gitdir
 * @param {string} args.ref
 * @param {string} args.oid
 * @param {string|Uint8Array} args.note
 * @param {boolean} [args.force]
 * @param {Object} [args.author]
 * @param {string} [args.author.name]
 * @param {string} [args.author.email]
 * @param {Date} [args.author.date]
 * @param {number} [args.author.timestamp]
 * @param {number} [args.author.timezoneOffset]
 * @param {Object} [args.committer = author]
 * @param {string} [args.committer.name]
 * @param {string} [args.committer.email]
 * @param {Date} [args.committer.date]
 * @param {number} [args.committer.timestamp]
 * @param {number} [args.committer.timezoneOffset]
 * @param {string} [args.signingKey]
 *
 * @returns {Promise<string>}
 */

export async function addNote ({
  fs,
  sign,
  gitdir,
  ref,
  oid,
  note,
  force,
  author,
  committer,
  signingKey
}) {
  // Get the current note commit
  let parent
  try {
    parent = await GitRefManager.resolve({ gitdir, fs, ref })
  } catch (err) {
    if (err.code !== E.ResolveRefError) {
      throw err
    }
  }

  // I'm using the "empty tree" magic number here for brevity
  const result = await readTree({
    fs,
    gitdir,
    oid: parent || '4b825dc642cb6eb9a060e54bf8d69288fbee4904'
  })
  let tree = result.tree

  // Handle the case where a note already exists
  if (force) {
    tree = tree.filter(entry => entry.path !== oid)
  } else {
    for (const entry of tree) {
      if (entry.path === oid) {
        throw new GitError(E.NoteAlreadyExistsError, {
          note: entry.oid,
          oid
        })
      }
    }
  }

  // Create the note blob
  if (typeof note === 'string') {
    note = Buffer.from(note, 'utf8')
  }
  const noteOid = await writeBlob({
    fs,
    gitdir,
    blob: note
  })

  // Create the new note tree
  tree.push({ mode: '100644', path: oid, oid: noteOid, type: 'blob' })
  const treeOid = await writeTree({
    fs,
    gitdir,
    tree
  })

  // Create the new note commit
  const commitOid = await commit({
    fs,
    sign,
    gitdir,
    ref,
    tree: treeOid,
    parent: parent && [parent],
    message: `Note added by 'isomorphic-git addNote'\n`,
    author,
    committer,
    signingKey
  })

  return commitOid
}
