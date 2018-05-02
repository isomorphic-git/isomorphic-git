import { pkg } from '../utils/pkg'

/**
 * Return the version number of isomorphic-git
 *
 * @link https://isomorphic-git.github.io/docs/version.html
 */
export function version () {
  return pkg.version
}
