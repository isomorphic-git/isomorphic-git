import { pkg } from '../utils/pkg'

/**
 * Return the version number of 'isomorphic-git'
 *
 * I don't know why you might need this. I added it just so I could check that I was getting
 * the correct version of the library and not a cached version.
 *
 * TODO: Semantic-release broke this, now it always says '0.0.0-development'. Need to add a
 * prepublishOnly script to find & replace that with the actual version number.
 *
 * @returns {string} version - the version string taken from package.json at publication time
 * @example
 * console.log(git.version())
 */
export function version () {
  return pkg.version
}
