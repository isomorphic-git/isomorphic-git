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
    const platform = process.platform

    let systemConfigPath = ''
    if (platform === 'win32') {
      systemConfigPath = path.join(
        'C:',
        'Program Files',
        'Git',
        'etc',
        'gitconfig'
      )
    } else if (platform === 'linux') {
      systemConfigPath = path.join('/', 'etc', 'gitconfig')
    } else if (platform === 'darwin') {
      systemConfigPath = path.join(
        '/',
        'Library',
        'Developer',
        'CommandLineTools',
        'usr',
        'share',
        'git-core',
        'gitconfig'
      )
    }
    const systemConfig = await readConfig(fs, systemConfigPath, 'system')

    const HOME = process.env.HOME || ''
    const XDG_CONFIG_HOME =
      process.env.XDG_CONFIG_HOME || (HOME && path.join(HOME, '.config'))

    const globalXDGConfig = await (
      await readConfig(
        fs,
        path.join(XDG_CONFIG_HOME, 'git', 'config'),
        'global'
      )
    ).appendConfig(systemConfig)

    const globalConfig = await (
      await readConfig(fs, path.join(HOME, '.gitconfig'), 'global')
    ).appendConfig(globalXDGConfig)

    const localConfig = await (
      await readConfig(fs, path.join(gitdir, 'config'))
    ).appendConfig(globalConfig)

    return localConfig
  }

  static async save({ fs, gitdir, config }) {
    // write only local configs to local config file, treat other config files as readonly
    config.parsedConfig = config.parsedConfig.filter(c => c.type === 'local')
    await fs.write(`${gitdir}/config`, config.toString(), {
      encoding: 'utf8',
    })
  }
}
