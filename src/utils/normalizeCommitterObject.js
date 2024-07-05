import { normalizeAuthorObject } from '../utils/normalizeAuthorObject.js'

/**
 * Returns an commiter object by populating properties from the provided commiter object,
 * and falling back first to the provied author object, then to Config and current date/time for missing properties.
 *
 * @param {Object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {string} [args.gitdir] - The [git directory](dir-vs-gitdir.md) path
 * @param {Object} [args.author={}] - The author object.
 * @param {Object} [args.committer={}] - The committer object.
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
