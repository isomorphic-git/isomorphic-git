// @flow
import { GitConfig } from './models'
import { read, write } from './models/utils'

export class GitConfigManager {
  static async get ({ gitdir }) {
    // We can improve efficiency later if needed.
    // TODO: read from full list of git config files
    let text = await read(`${gitdir}/config`, { encoding: 'utf8' })
    return GitConfig.from(text)
  }
  static async save ({ gitdir, config }) {
    // We can improve efficiency later if needed.
    // TODO: handle saving to the correct global/user/repo location
    await write(`${gitdir}/config`, config.toString(), {
      encoding: 'utf8'
    })
  }
}
