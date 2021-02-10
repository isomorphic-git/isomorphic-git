import '../typedefs.js'

import { _branch } from '../commands/branch.js'
import { _clone } from '../commands/clone.js'
import { GitConfigManager } from '../managers/GitConfigManager.js'
import { join } from '../utils/join.js'

export async function _worktreeAdd({ fs, http, gitdir, path, ref }) {
  const config = await GitConfigManager.get({ fs, gitdir })
  const remote = await config.get(`branch.${ref}.remote`)
  const url = await config.get(`remote.${remote}.url`)
  const gitpath = join(path, '.git')
  await _clone({ fs, http, gitpath, url })
  await _branch({ fs, gitpath, ref, checkout: true })
}
