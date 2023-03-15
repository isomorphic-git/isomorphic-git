import { _getConfig } from '../commands/getConfig'

/**
 *
 * @returns {Promise<void | {name: string, email: string, date: Date, timestamp: number, timezoneOffset: number }>}
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
