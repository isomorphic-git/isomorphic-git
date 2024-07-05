import '../typedefs.js'

import { _getConfig } from '../commands/getConfig'

/**
 * Returns an author object by populating properties from the provided author object,
 * and falling back first to the author of commit object, then to the Config and current date/time for missing properties.
 *
 * @param {Object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {string} [args.gitdir] - The [git directory](dir-vs-gitdir.md) path
 * @param {Object} [args.author={}] - The author object.
 * @param {CommitObject} [args.commit={}] - A commit object.
 *
 * @returns {Promise<void | {name: string, email: string, timestamp: number, timezoneOffset: number }>}
 */
export async function normalizeAuthorObject({
  fs,
  gitdir,
  author = {},
  commit = {},
}) {
  const commitAuthor = commit.author ? commit.author : {}

  const name =
    author.name ||
    commitAuthor.name ||
    (await _getConfig({ fs, gitdir, path: 'user.name' }))
  const email =
    author.email ||
    commitAuthor.email ||
    (await _getConfig({ fs, gitdir, path: 'user.email' })) ||
    ''

  if (name === undefined) {
    return undefined
  }

  const timestamp =
    author.timestamp != null
      ? author.timestamp
      : commitAuthor.timestamp != null
      ? commitAuthor.timestamp
      : Math.floor(Date.now() / 1000)
  const timezoneOffset =
    author.timezoneOffset != null
      ? author.timezoneOffset
      : commitAuthor.timezoneOffset != null
      ? commitAuthor.timezoneOffset
      : new Date(timestamp * 1000).getTimezoneOffset()

  return { name, email, timestamp, timezoneOffset }
}
