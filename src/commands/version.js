import { pkg } from '../utils/pkg.js'

/**
 * Return the version number of isomorphic-git
 *
 * @link https://isomorphic-git.github.io/docs/version.html
 */
export function version () {
  try {
    return pkg.version
  } catch (err) {
    err.caller = 'git.version'
    throw err
  }
}
