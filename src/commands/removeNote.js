// @ts-check
import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { E } from '../models/GitError.js'
import { join } from '../utils/join'

import { commit } from './commit.js'
import { readTree } from './readTree.js'
import { writeTree } from './writeTree.js'

/**
 * Remove an object note
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {SignCallback} [args.sign] - a PGP signing implementation
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.ref] - The notes ref to look under
 * @param {string} [args.oid] - The SHA-1 object id of the object to remove the note from.
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
  author,
  committer,
  signingKey
}) {
  try {
    const fs = new FileSystem(_fs)

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
      fs: _fs,
      dir,
      gitdir,
      oid: parent || '4b825dc642cb6eb9a060e54bf8d69288fbee4904'
    })
    let tree = result.tree

    // Remove the note blob entry from the tree
    tree = tree.filter(entry => entry.path !== oid)

    // Create the new note tree
    const treeOid = await writeTree({
      fs: _fs,
      dir,
      gitdir,
      tree
    })

    // Create the new note commit
    const commitOid = await commit({
      fs: _fs,
      sign,
      dir,
      gitdir,
      ref,
      tree: treeOid,
      parent: parent && [parent],
      message: `Note removed by 'isomorphic-git removeNote'\n`,
      author,
      committer,
      signingKey
    })

    return commitOid
  } catch (err) {
    err.caller = 'git.removeNote'
    throw err
  }
}
