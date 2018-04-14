// For now, to remain API compatible, we'll pre-register the GitRemoteHTTP helper
import { GitRemoteHTTP } from './GitRemoteHTTP'
export const remoteHelpers = new Map()
remoteHelpers.set('http', GitRemoteHTTP)
remoteHelpers.set('https', GitRemoteHTTP)

function parseRemoteUrl ({ url }) {
  let matches = url.match(/(\w+)(:\/\/|::)(.*)/)
  if (matches === null) return
  /*
   * When git encounters a URL of the form <transport>://<address>, where <transport> is
   * a protocol that it cannot handle natively, it automatically invokes git remote-<transport>
   * with the full URL as the second argument.
   *
   * @see https://git-scm.com/docs/git-remote-helpers
   */
  if (matches[2] === '://') {
    return {
      transport: matches[1],
      address: matches[0]
    }
  }
  /*
   * A URL of the form <transport>::<address> explicitly instructs git to invoke
   * git remote-<transport> with <address> as the second argument.
   *
   * @see https://git-scm.com/docs/git-remote-helpers
   */
  if (matches[2] === '::') {
    return {
      transport: matches[1],
      address: matches[3]
    }
  }
}

export class GitRemoteManager {
  static getRemoteHelperFor ({ url }) {
    let parts = parseRemoteUrl({ url })
    if (!parts) {
      throw new Error(`Cannot determine protocol of remote URL: "${url}"`)
    }
    if (remoteHelpers.has(parts.transport)) {
      return remoteHelpers.get(parts.transport)
    }
    throw new Error(
      `Git remote "${url}" uses an unrecognized transport protocol: "${
        parts.transport
      }"`
    )
  }
}
