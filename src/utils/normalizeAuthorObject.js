import { _getConfig } from '../commands/getConfig'

/**
 * Returns an author object by populating properties from the provided author object,
 * and falling back to Config and current date/time for missing properties.
 *
 * @param {Object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {string} [args.gitdir] - The [git directory](dir-vs-gitdir.md) path
 * @param {Object} [args.author={}] - The author object.
 *
 * @returns {Promise<void | {name: string, email: string, timestamp: number, timezoneOffset: number }>}
 */
export async function normalizeAuthorObject({ fs, gitdir, author = {} }) {
  let { name, email, timestamp, timezoneOffset } = author
  name = name || (await _getConfig({ fs, gitdir, path: 'user.name' }))
  email = email || (await _getConfig({ fs, gitdir, path: 'user.email' })) || ''

  if (name === undefined) {
    return undefined
  }

  timestamp = timestamp != null ? timestamp : Math.floor(Date.now() / 1000)
  timezoneOffset =
    timezoneOffset != null
      ? timezoneOffset
      : new Date(timestamp * 1000).getTimezoneOffset()

  return { name, email, timestamp, timezoneOffset }
}
