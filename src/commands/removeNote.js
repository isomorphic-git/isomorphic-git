// @ts-check
import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join'
import { cores } from '../utils/plugins.js'

import { readObject } from './readObject'
import { writeObject } from './writeObject.js'
import { GitCommit } from '../models/GitCommit.js'
import { normalizeAuthorObject } from '../utils/normalizeAuthorObject.js'
import { GitError, E } from '../models/GitError.js'

/**
 * Remove an object note
 * @param {object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {FileSystem} [args.fs] - [deprecated] The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.ref] - The notes ref to look under
 * @param {string} [args.oid] - The SHA-1 object id of the object to remove the note from.
 * @param {Object} [args.author] - The details about the author.
 * @param {string} [args.author.name] - Default is `user.name` config.
 * @param {string} [args.author.email] - Default is `user.email` config.
 * @param {string} [args.author.date] - Set the author timestamp field. Default is the current date.
 * @param {string} [args.author.timestamp] - Set the author timestamp field. This is an alternative to using `date` using an integer number of seconds since the Unix epoch instead of a JavaScript date object.
 * @param {string} [args.author.timezoneOffset] - Set the author timezone offset field. This is the difference, in minutes, from the current timezone to UTC. Default is `(new Date()).getTimezoneOffset()`.
 * @param {Object} [args.committer = author] - The details about the commit committer, in the same format as the author parameter. If not specified, the author details are used.
 * @param {string} [args.signingKey] - Sign the tag object using this private PGP key.
 *
 * @returns {Promise<string>} Resolves successfully with the SHA-1 object id of the commit object for the note removal.
 */

export async function removeNote ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  ref = 'refs/notes/commits',
  oid,
  author,
  committer,
  signingKey
}) {
  const fs = new FileSystem(_fs)

  let refOid
  try {
    refOid = await GitRefManager.resolve({ gitdir, fs, ref })
  } catch (Error) {
    throw new GitError(E.InvalidRefNameError)
  }

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

  const previousCommit = await readObject({ gitdir, fs, oid: refOid, format: 'parsed' })
  const treeOid = previousCommit.object.tree
  const treeObject = (await readObject({ gitdir, fs, oid: treeOid, format: 'parsed' })).object

  const entries = treeObject.entries
  var removedNoteOid
  for (let i = 0; i < entries.length; i++) {
    if (entries[i].path === oid) {
      removedNoteOid = entries.splice(i, 1)
      break
    }
  }
  if (!removedNoteOid) {
    throw new GitError(E.NoNoteOnObjectError)
  }

  const newTreeOid = await writeObject({
    fs,
    gitdir,
    type: 'tree',
    object: treeObject
  })

  const message = `Note removed by 'isomorphic-git removeNote'\n`

  let commit = GitCommit.from({
    tree: newTreeOid,
    parent: [previousCommit.oid],
    author,
    committer,
    message
  })
  if (signingKey) {
    const pgp = cores.get(core).get('pgp')
    commit = await GitCommit.sign(commit, pgp, signingKey)
  }
  const commitOid = await writeObject({
    fs,
    gitdir,
    type: 'commit',
    object: commit.toObject()
  })
  // Update branch pointer
  await GitRefManager.writeRef({
    fs,
    gitdir,
    ref,
    value: commitOid
  })

  return commitOid
}
