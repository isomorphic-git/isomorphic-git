import path from 'path'

import { GitConfig } from '../models/GitConfig.js'

function getSystemConfigPath() {
  let systemConfigPath
  if (!(process.env.GIT_CONFIG_NOSYSTEM === '1')) {
    if (process.env.GIT_CONFIG_SYSTEM) {
      systemConfigPath = process.env.GIT_CONFIG_SYSTEM
    } else {
      const platform = process.platform

      if (!platform) {
        throw new Error('no platform')
      }

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
    }
  }

  return systemConfigPath
}

function getGlobalConfigPath() {
  return process.env.HOME && path.join(process.env.HOME, '.gitconfig')
}

function getGlobalXDGConfigPath() {
  return (
    (process.env.XDG_CONFIG_HOME || process.env.HOME) &&
    path.join(
      process.env.XDG_CONFIG_HOME || path.join(process.env.HOME, '.config'),
      'git',
      'config'
    )
  )
}

async function readConfig(fs, path, type) {
  let config = new GitConfig()
  // try {
  config = GitConfig.from(
    await fs.read(path, {
      encoding: 'utf8',
    }),
    type
  )
  // } catch (err) {}
  return config
}

export class GitConfigManager {
  static async get({ fs, gitdir }) {
    const systemConfig = await readConfig(fs, getSystemConfigPath(), 'system')

    let globalConfigPath = ''
    let globalXDGConfig = new GitConfig()
    if (process.env.GIT_CONFIG_GLOBAL) {
      globalXDGConfig = systemConfig
      globalConfigPath = process.env.GIT_CONFIG_GLOBAL
    } else {
      globalXDGConfig = await (
        await readConfig(fs, getGlobalXDGConfigPath(), 'global')
      ).appendConfig(systemConfig)
      globalConfigPath = getGlobalConfigPath()
    }
    const globalConfig = await (
      await readConfig(fs, globalConfigPath, 'global')
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
