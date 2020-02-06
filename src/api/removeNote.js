// @ts-check
import '../commands/typedefs.js'

import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join.js'
import { removeNote as _removeNote } from '../commands/removeNote.js'
import { assertParameter } from '../utils/assertParameter.js'
import { normalizeAuthorObject } from '../utils/normalizeAuthorObject.js'
import { normalizeCommitterObject } from '../utils/normalizeCommitterObject.js'
import { GitError, E } from '../models/GitError.js'

/**
 * Remove an object note
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {SignCallback} [args.sign] - a PGP signing implementation
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.ref] - The notes ref to look under
 * @param {string} args.oid - [required] The SHA-1 object id of the object to remove the note from.
 * @param {Object} [args.author] - The details about the author.
 * @param {string} [args.author.name] - Default is `user.name` config.
 * @param {string} [args.author.email] - Default is `user.email` config.
 * @param {Date} [args.author.date] - Set the author timestamp field. Default is the current date.
 * @param {number} [args.author.timestamp] - Set the author timestamp field. This is an alternative to using `date` using an integer number of seconds since the Unix epoch instead of a JavaScript date object.
 * @param {number} [args.author.timezoneOffset] - Set the author timezone offset field. This is the difference, in minutes, from the current timezone to UTC. Default is `(new Date()).getTimezoneOffset()`.
 * @param {Object} [args.committer = author] - The details about the note committer, in the same format as the author parameter. If not specified, the author details are used.
 * @param {string} [args.committer.name] - Default is `user.name` config.
 * @param {string} [args.committer.email] - Default is `user.email` config.
 * @param {Date} [args.committer.date] - Set the committer timestamp field. Default is the current date.
 * @param {number} [args.committer.timestamp] - Set the committer timestamp field. This is an alternative to using `date` using an integer number of seconds since the Unix epoch instead of a JavaScript date object.
 * @param {number} [args.committer.timezoneOffset] - Set the committer timezone offset field. This is the difference, in minutes, from the current timezone to UTC. Default is `(new Date()).getTimezoneOffset()`.
 * @param {string} [args.signingKey] - Sign the tag object using this private PGP key.
 *
 * @returns {Promise<string>} Resolves successfully with the SHA-1 object id of the commit object for the note removal.
 */

export async function removeNote ({
  fs: _fs,
  sign,
  dir,
  gitdir = join(dir, '.git'),
  ref = 'refs/notes/commits',
  oid,
  author: _author,
  committer: _committer,
  signingKey
}) {
  try {
    assertParameter('fs', _fs)
    assertParameter('gitdir', gitdir)
    assertParameter('oid', oid)

    const fs = new FileSystem(_fs)

    const author = await normalizeAuthorObject({ fs, gitdir, author: _author })
    if (!author) throw new GitError(E.MissingAuthorError)

    const committer = await normalizeCommitterObject({ fs, gitdir, author, committer: _committer })
    if (!committer) throw new GitError(E.MissingCommitterError)

    return await _removeNote({
      fs,
      sign,
      gitdir,
      ref,
      oid,
      author,
      committer,
      signingKey
    })
  } catch (err) {
    err.caller = 'git.removeNote'
    throw err
  }
}
