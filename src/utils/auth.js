/**
 * Use with push and fetch to set Basic Authentication headers.
 *
 * @link https://isomorphic-git.github.io/docs/utils_auth.html
 */
export function auth (username, password) {
  // Allow specifying it as one argument (mostly for CLI inputability)
  if (password === undefined) {
    const i = username.indexOf(':')
    if (i > -1) {
      password = username.slice(i + 1)
      username = username.slice(0, i)
    } else {
      password = '' // Enables the .auth(GITHUB_TOKEN) no-username shorthand
    }
  }
  return { username, password }
}
