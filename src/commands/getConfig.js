import { GitConfigManager } from './managers'

export async function getConfig ({ gitdir, path }) {
  const config = await GitConfigManager.get({ gitdir })
  const value = await config.get(path)
  return value
}
