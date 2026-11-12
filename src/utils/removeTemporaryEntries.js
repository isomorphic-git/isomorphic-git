import { MultipleGitError } from '../errors/MultipleGitError.js'

/**
 * Attempt every temporary-entry cleanup and retain the operation's original error.
 * Cleanup failures are reported separately on that error, or together if cleanup alone failed.
 *
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string[]} args.files
 * @param {string[]} [args.directories]
 * @param {Error & {cleanupErrors?: Error[]}} [args.error]
 * @returns {Promise<void>}
 */
export async function removeTemporaryEntries({
  fs,
  files,
  directories = [],
  error,
}) {
  const results = await Promise.allSettled(
    files.map(filepath => fs.rm(filepath))
  )
  for (const directory of directories) {
    results.push(...(await Promise.allSettled([fs.rmdir(directory)])))
  }
  const cleanupErrors = results
    .filter(result => result.status === 'rejected')
    .map(result => result.reason)
  if (error) {
    if (cleanupErrors.length) {
      Object.assign(error, {
        cleanupErrors: [...(error.cleanupErrors || []), ...cleanupErrors],
      })
    }
    throw error
  }
  if (cleanupErrors.length) throw new MultipleGitError(cleanupErrors)
}
