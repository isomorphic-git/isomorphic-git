import fs from 'fs'
import pify from 'pify'
import GitConfig from '../models/GitConfig'

export default class GitConfigManager {
  static async get ({ gitdir }) {
    // We can improve efficiency later if needed.
    // TODO: read from full list of git config files
    let text = await pify(fs.readFile)(`${gitdir}/config`, { encoding: 'utf8' })
    return GitConfig.from(text)
  }
}
