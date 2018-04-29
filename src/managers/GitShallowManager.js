import AsyncLock from 'async-lock'
import path from 'path'

import { FileSystem } from '../models'

const lock = new AsyncLock()

export class GitShallowManager {
  static async read ({ fs: _fs, gitdir }) {
    const fs = new FileSystem(_fs)
    const filepath = path.join(gitdir, 'shallow')
    let oids = new Set()
    await lock.acquire(filepath, async function () {
      let text = await fs.read(filepath, { encoding: 'utf8' })
      if (text === null) return
      text
        .trim()
        .split('\n')
        .map(oid => oids.add(oid))
    })
    return oids
  }
  static async write ({ fs: _fs, gitdir, oids }) {
    const fs = new FileSystem(_fs)
    const filepath = path.join(gitdir, 'shallow')
    let text = [...oids].join('\n') + '\n'
    await lock.acquire(filepath, async function () {
      await fs.write(filepath, text, {
        encoding: 'utf8'
      })
    })
  }
}
