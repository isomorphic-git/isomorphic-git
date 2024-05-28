import { homedir } from 'os'
import { join } from 'path'

import { GitConfig } from '../models/GitConfig.js'

export class GitConfigManager {
  static async get({ fs, gitdir, global = false }) {
    // We can improve efficiency later if needed.
    // TODO: read from full list of git config files
    const configPath = global
      ? join(homedir(), '.gitconfig')
      : join(gitdir, 'config')
    const text = await fs.read(configPath, { encoding: 'utf8' })
    return GitConfig.from(text)
  }

  static async save({ fs, gitdir, config, global = false }) {
    // We can improve efficiency later if needed.
    // TODO: handle saving to the correct global/user/repo location
    const configPath = global
      ? join(homedir(), '.gitconfig')
      : join(gitdir, 'config')
    await fs.write(configPath, config.toString(), {
      encoding: 'utf8',
    })
  }
}
