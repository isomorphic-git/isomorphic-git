import path from 'path'

import { GitConfig } from '../models/GitConfig.js'

async function readConfig(fs, path, type) {
  let config = new GitConfig()
  try {
    config = GitConfig.from(
      await fs.read(path, {
        encoding: 'utf8',
      }),
      type
    )
  } catch (err) {}
  return config
}

export class GitConfigManager {
  static async get({ fs, gitdir }) {
    const HOME = process.env.HOME || ''
    const XDG_CONFIG_HOME =
      process.env.XDG_CONFIG_HOME || (HOME && path.join(HOME, '.config'))

    const XDGConfig = await readConfig(
      fs,
      path.join(XDG_CONFIG_HOME, 'git', 'config'),
      'XDG'
    )

    const userConfig = await (
      await readConfig(fs, path.join(HOME, '.gitconfig'), 'user')
    ).appendConfig(XDGConfig)

    const config = await (
      await readConfig(fs, path.join(gitdir, 'config'))
    ).appendConfig(userConfig)

    return config
  }

  static async save({ fs, gitdir, config }) {
    // write only local configs to local config file, treat other config files as readonly
    config.parsedConfig = config.parsedConfig.filter(c => c.type === 'local')
    await fs.write(`${gitdir}/config`, config.toString(), {
      encoding: 'utf8',
    })
  }
}
