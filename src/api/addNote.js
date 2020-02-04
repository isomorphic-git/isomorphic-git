// @ts-check
import '../commands/typedefs.js'

import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join'
import { addNote as _addNote } from '../commands/addNote.js'
import { assertParameter } from '../utils/assertParameter.js'

/**
 * Add or update an object note
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {SignCallback} [args.sign] - a PGP signing implementation
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.ref] - The notes ref to look under
 * @param {string} args.oid - The SHA-1 object id of the object to add the note to.
 * @param {string|Uint8Array} args.note - The note to add
 * @param {boolean} [args.force] - Over-write note if it already exists.
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
 * @param {string} [args.signingKey] - Sign the note commit using this private PGP key.
 *
 * @returns {Promise<string>} Resolves successfully with the SHA-1 object id of the commit object for the added note.
 */

export async function addNote ({
  fs,
  sign,
  dir,
  gitdir = join(dir, '.git'),
  ref = 'refs/notes/commits',
  oid,
  note,
  force,
  author,
  committer,
  signingKey
}) {
  try {
    assertParameter('addNote', 'fs', fs)
    assertParameter('addNote', 'gitdir', gitdir)
    assertParameter('addNote', 'oid', oid)
    assertParameter('addNote', 'note', note)
    if (signingKey) {
      assertParameter('addNote', 'sign', sign)
    }
    return await _addNote({
      fs: new FileSystem(fs),
      sign,
      gitdir,
      ref,
      oid,
      note,
      force,
      author,
      committer,
      signingKey
    })
  } catch (err) {
    err.caller = 'git.addNote'
    throw err
  }
}
