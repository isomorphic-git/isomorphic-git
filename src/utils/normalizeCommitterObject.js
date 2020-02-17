import { normalizeAuthorObject } from '../utils/normalizeAuthorObject.js'

/**
 *
 * @returns {Promise<void | {name: string, email: string, timestamp: number, timezoneOffset: number }>}
 */
export async function normalizeCommitterObject({
  fs,
  gitdir,
  author,
  committer,
}) {
  committer = Object.assign({}, committer || author)
  // Match committer's date to author's one, if omitted
  if (author) {
    committer.timestamp = committer.timestamp || author.timestamp
    committer.timezoneOffset = committer.timezoneOffset || author.timezoneOffset
  }
  committer = await normalizeAuthorObject({ fs, gitdir, author: committer })
  return committer
}
