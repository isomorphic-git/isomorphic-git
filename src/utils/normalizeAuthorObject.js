import { config } from '../commands/config'

export async function normalizeAuthorObject ({ fs, gitdir, author = {} }) {
  let { name, email, date, timestamp, timezoneOffset } = author
  name = name || (await config({ fs, gitdir, path: 'user.name' }))
  email = email || (await config({ fs, gitdir, path: 'user.email' }))

  if (name === undefined || email === undefined) {
    return undefined
  }

  date = date || new Date()
  timestamp = timestamp != null ? timestamp : Math.floor(date.valueOf() / 1000)
  timezoneOffset =
    timezoneOffset != null ? timezoneOffset : date.getTimezoneOffset()

  return { name, email, date, timestamp, timezoneOffset }
}
