// @ts-check
import { ProcessManager } from '../managers/ProcessManager.js'

/**
 * Abort an ongoing operation
 *
 * @param {object} args
 * @param {string} args.processId = '' - which operation to abort
 *
 * @returns {Promise<void>} Resolves successfully
 *
 * @example
 * await git.abort({ processId })
 * console.log('done')
 *
 */
export async function abort ({
  processId
}) {
  ProcessManager.abort(processId)
}
