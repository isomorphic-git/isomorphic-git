// @ts-check
import { ProcessManager } from '../managers/ProcessManager.js'

/**
 * Abort an ongoing operation
 *
 * Currently only the `clone`, `fetch`, and `checkout` commands are abortable.
 *
 * @param {object} args
 * @param {string} args.processId = '' - identifies which operation to abort
 *
 * @returns {Promise<void>} Resolves successfully
 *
 * @example
 * const processId = $input((String(Math.random())))
 * git.clone({
 *   dir: '$input((/))',
 *   corsProxy: 'https://cors.isomorphic-git.org',
 *   url: '$input((https://github.com/isomorphic-git/isomorphic-git))',
 *   processId,
 *   $textarea((singleBranch: true,
 *   depth: 1))
 * }).catch(e => {
 *   if (e.name === 'AbortError') console.log('clone canceled')
 * })
 * await git.abort({ processId })
 * console.log('done')
 *
 */
export async function abort ({ processId }) {
  ProcessManager.abort(processId)
}
