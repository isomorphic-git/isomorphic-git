import { _getConfig } from '../commands/getConfig'

import { assignDefined } from './assignDefined.js'
/**
 * Return committer object by using properties with this priority:
 * (1) provided committer object
 * -> (2) provided author object
 * -> (3) committer of provided commit object
 * -> (4) Config and current date/time
 *
 * @param {Object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {string} [args.gitdir] - The [git directory](dir-vs-gitdir.md) path
 * @param {Object} [args.author] - The author object.
 * @param {Object} [args.committer] - The committer object.
 * @param {CommitObject} [args.commit] - A commit object.
 *
 * @returns {Promise<void | {name: string, email: string, timestamp: number, timezoneOffset: number }>}
 */
export async function normalizeCommitterObject({
  fs,
  gitdir,
  author,
  committer,
  commit,
}) {
  const timestamp = Math.floor(Date.now() / 1000)

  const defaultCommitter = {
    name: await _getConfig({ fs, gitdir, path: 'user.name' }),
    email: (await _getConfig({ fs, gitdir, path: 'user.email' })) || '', // committer.email is allowed to be empty string
    timestamp,
    timezoneOffset: new Date(timestamp * 1000).getTimezoneOffset(),
  }

  const normalizedCommitter = assignDefined(
    {},
    defaultCommitter,
    commit ? commit.committer : undefined,
    author,
    committer
  )

  if (normalizedCommitter.name === undefined) {
    return undefined
  }
  return normalizedCommitter
}
