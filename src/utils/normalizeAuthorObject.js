import '../typedefs.js'
import { _getConfig } from '../commands/getConfig'

import { assignDefined } from './assignDefined.js'

/**
 * Return author object by using properties following this priority:
 * (1) provided author object
 * -> (2) author of provided commit object
 * -> (3) Config and current date/time
 *
 * @param {Object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {string} [args.gitdir] - The [git directory](dir-vs-gitdir.md) path
 * @param {Object} [args.author] - The author object.
 * @param {CommitObject} [args.commit] - A commit object.
 *
 * @returns {Promise<void | {name: string, email: string, timestamp: number, timezoneOffset: number }>}
 */
export async function normalizeAuthorObject({ fs, gitdir, author, commit }) {
  const timestamp = Math.floor(Date.now() / 1000)

  const defaultAuthor = {
    name: await _getConfig({ fs, gitdir, path: 'user.name' }),
    email: (await _getConfig({ fs, gitdir, path: 'user.email' })) || '', // author.email is allowed to be empty string
    timestamp,
    timezoneOffset: new Date(timestamp * 1000).getTimezoneOffset(),
  }

  // Populate author object by using properties with this priority:
  // (1) provided author object
  // -> (2) author of provided commit object
  // -> (3) default author
  const normalizedAuthor = assignDefined(
    {},
    defaultAuthor,
    commit ? commit.author : undefined,
    author
  )

  if (normalizedAuthor.name === undefined) {
    return undefined
  }

  return normalizedAuthor
}
