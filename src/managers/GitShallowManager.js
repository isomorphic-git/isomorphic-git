// @flow
import path from 'path'
// TODO: Add file locks.
export class GitShallowManager {
  static async read ({ fs, gitdir }) {
    let oids = new Set()
    let text = await fs.read(path.join(gitdir, 'shallow'), { encoding: 'utf8' })
    if (text === null) return oids
    text
      .trim()
      .split('\n')
      .map(oid => oids.add(oid))
    return oids
  }
  static async write ({ fs, gitdir, oids }) {
    let text = ''
    for (let oid of oids) {
      text += `${oid}\n`
    }
    await fs.write(path.join(gitdir, 'shallow'), text, {
      encoding: 'utf8'
    })
  }
}
