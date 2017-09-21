// @flow
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
  static async save ({ gitdir, config }) {
    // We can improve efficiency later if needed.
    // TODO: handle saving to the correct global/user/repo location
    await pify(fs.writeFile)(`${gitdir}/config`, config.toString(), {
      encoding: 'utf8'
    })
  } /*: { gitdir: string, config: GitConfig } */
}
