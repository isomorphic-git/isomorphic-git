import { remoteHelpers } from '../managers/GitRemoteManager'
import { GitSigningManager } from '../managers'

export async function use (plugin) {
  if (plugin.remoteHelper) {
    for (const proto of plugin.remoteHelper.protocols) {
      if (remoteHelpers.has(proto)) {
        console.log(
          `WARN: isomorphic-git plugin ${
            plugin.name
          } registered the "${proto}" protocol overriding the ${
            remoteHelpers.get(proto).name
          } plugin which previously handled that protocol.`
        )
      }
      remoteHelpers.set(proto, plugin)
    }
  }
  if (plugin.signingHelper) {
    GitSigningManager.register(plugin.signingHelper)
  }
}
