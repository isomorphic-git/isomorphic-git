/**
 *
 * Use with {@link push} and {@link fetch} to set Basic Authentication headers.
 * This for is for *actual* OAuth2 tokens (not "personal access tokens").
 * Unfortunately, all the major git hosting companies have chosen different conventions!
 * Lucky for you, I already looked up and codified it for you.
 *
 * - oauth2('github', token) - Github uses `token` as the username, and 'x-oauth-basic' as the password.
 * - oauth2('bitbucket', token) - Bitbucket uses 'x-token-auth' as the username, and `token` as the password.
 * - oauth2('gitlab', token) - Gitlab uses 'oauth2' as the username, and `token` as the password.
 *
 * I will gladly accept pull requests for more companies' conventions.
 *
 * @param {string} company
 * @param {string} token
 * @returns {{username: string, password: string}}
 *
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
        `I don't know how ${company} expects its Basic Auth headers to be formatted for OAuth2 usage. If you do, you can use the regular '.auth(username, password)' to set the basic auth header yourself.`
      )
  }
}
