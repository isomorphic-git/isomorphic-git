// @flow
import path from 'path'
import { read, write } from './models/utils'
// TODO: Add file locks.
export class GitShallowManager {
  static async read ({ gitdir }) {
    let oids = new Set()
    let text = await read(path.join(gitdir, 'shallow'), { encoding: 'utf8' })
    if (text === null) return oids
    text
      .trim()
      .split('\n')
      .map(oid => oids.add(oid))
    return oids
  }
  static async write ({ gitdir, oids }) {
    let text = ''
    for (let oid of oids) {
      text += `${oid}\n`
    }
    await write(path.join(gitdir, 'shallow'), text, {
      encoding: 'utf8'
    })
  }
}
