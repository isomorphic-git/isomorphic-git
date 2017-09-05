import GitConfigManager from '../managers/GitConfigManager'

export default async function getConfig ({ gitdir, path }) {
  const config = await GitConfigManager.get({ gitdir })
  return config.get(path)
}
