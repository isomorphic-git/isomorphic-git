/**
 *
 * Use with {@link #gitpush .push} and {@link #gitpull .pull} to set Basic Authentication headers.
 * This works for basic username / password auth, or the newer username / token auth
 * that is often required if 2FA is enabled.
 *
 * Authentication is normally required for pushing to a git repository.
 * It may also be required to clone or fetch from a private repository.
 * Git does all its authentication using HTTPS Basic Authentication.
 * Usually this is straightforward, but there are some things to watch out for.
 *
 * If you have two-factor authentication (2FA) enabled on your account, you
 * probably cannot push or pull using your regular username and password.
 * Instead, you may have to create a Personal Access Token (or an App
 * Password in Bitbucket lingo) and use that to authenticate.
 *
 * @param {string} username
 * @param {string} password
 * @returns {username, password}
 *
 * @example
 * let {username, password} = auth('username', 'password')
 *
 * // a one-argument version is also supported
 * let {username, password} = auth('username:password')
 *
 * // Personal Access Token Authentication
 * // (note Bitbucket calls theirs App Passwords instead for some reason)
 * let {username, password} = auth('username', 'personal access token')
 * let {username, password} = auth('username', 'app password')
 * let {username, password} = auth('personal access token') // Github (only) lets you leave out the username
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
