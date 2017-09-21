import GitConfigManager from '../managers/GitConfigManager'

export default async function getConfig ({ gitdir, path }) {
  const config = await GitConfigManager.get({ gitdir })
  const value = await config.get(path)
  return value
}
