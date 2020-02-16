// @ts-check
import { pkg } from '../utils/pkg.js'

/**
 * Return the version number of isomorphic-git
 *
 * I don't know why you might need this. I added it just so I could check that I was getting
 * the correct version of the library and not a cached version.
 *
 * @returns {string} the version string taken from package.json at publication time
 *
 * @example
 * console.log(git.version())
 *
 */
export function version() {
  try {
    return pkg.version
  } catch (err) {
    err.caller = 'git.version'
    throw err
  }
}
