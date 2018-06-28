import { E, GitError } from '../models/GitError.js'

/**
 * Use with push and fetch to set Basic Authentication headers.
 *
 * @link https://isomorphic-git.github.io/docs/utils_oauth2.html
 */
export function oauth2 (company, token) {
  switch (company) {
    case 'github':
      return {
        username: token,
        password: 'x-oauth-basic'
      }
    case 'bitbucket':
      return {
        username: 'x-token-auth',
        password: token
      }
    case 'gitlab':
      return {
        username: 'oauth2',
        password: token
      }
    default:
      throw new GitError(E.UnknownOauth2Format, { company })
  }
}
