import AsyncLock from 'async-lock'

import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join.js'

let lock = null

export class GitShallowManager {
  static async read ({ fs: _fs, gitdir }) {
    const fs = new FileSystem(_fs)
    if (lock === null) lock = new AsyncLock()
    const filepath = join(gitdir, 'shallow')
    const oids = new Set()
    await lock.acquire(filepath, async function () {
      const text = await fs.read(filepath, { encoding: 'utf8' })
      if (text === null) return oids // no file
      if (text.trim() === '') return oids // empty file
      text
        .trim()
        .split('\n')
        .map(oid => oids.add(oid))
    })
    return oids
  }

  static async write ({ fs: _fs, gitdir, oids }) {
    const fs = new FileSystem(_fs)
    if (lock === null) lock = new AsyncLock()
    const filepath = join(gitdir, 'shallow')
    if (oids.size > 0) {
      const text = [...oids].join('\n') + '\n'
      await lock.acquire(filepath, async function () {
        await fs.write(filepath, text, {
          encoding: 'utf8'
        })
      })
    } else {
      // No shallows
      await lock.acquire(filepath, async function () {
        await fs.rm(filepath)
      })
    }
  }
}
