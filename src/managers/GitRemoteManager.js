import { E, GitError } from '../models/GitError.js'
import { translateSSHtoHTTP } from '../utils/translateSSHtoHTTP.js'

import { GitRemoteHTTP } from './GitRemoteHTTP'

function parseRemoteUrl ({ url }) {
  // the stupid "shorter scp-like syntax"
  if (url.startsWith('git@')) {
    return {
      transport: 'ssh',
      address: url
    }
  }
  const matches = url.match(/(\w+)(:\/\/|::)(.*)/)
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
    // TODO: clean up the remoteHelper API and move into PluginCore
    const remoteHelpers = new Map()
    remoteHelpers.set('http', GitRemoteHTTP)
    remoteHelpers.set('https', GitRemoteHTTP)

    const parts = parseRemoteUrl({ url })
    if (!parts) {
      throw new GitError(E.RemoteUrlParseError, { url })
    }
    if (remoteHelpers.has(parts.transport)) {
      return remoteHelpers.get(parts.transport)
    }
    throw new GitError(E.UnknownTransportError, {
      url,
      transport: parts.transport,
      suggestion: parts.transport === 'ssh' ? translateSSHtoHTTP(url) : void 0
    })
  }
}
