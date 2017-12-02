/**
 * @param {string} username
 * @param {string} password
 * @returns {Git} this
 *
 * Use with {@link #gitpush .push} and {@link #gitpull .pull} to set Basic Authentication headers.
 * This works for basic username / password auth, or the newer username / token auth
 * that is often required if 2FA is enabled.
 */
export function auth (username, password) {
  // Allow specifying it as one argument (mostly for CLI inputability)
  if (password === undefined) {
    let i = username.indexOf(':')
    if (i > -1) {
      password = username.slice(i + 1)
      username = username.slice(0, i)
    } else {
      password = '' // Enables the .auth(GITHUB_TOKEN) no-username shorthand
    }
  }
  return { username, password }
}
