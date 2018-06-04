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
      throw new Error(
        `oauth2.js:25 E74 I don't know how ${company} expects its Basic Auth headers to be formatted for OAuth2 usage. If you do, you can use the regular '.auth(username, password)' to set the basic auth header yourself.`
      )
  }
}
