import GitConfigManager from '../managers/GitConfigManager'

export default async function setConfig ({ gitdir, path, value }) {
  const config = await GitConfigManager.get({ gitdir })
  await config.set(path, value)
  await GitConfigManager.save({ gitdir, config })
}
