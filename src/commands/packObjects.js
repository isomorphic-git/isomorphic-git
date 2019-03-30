import { pack } from './pack'

import { FileSystem } from '../models/FileSystem.js'
import { collect } from '../utils/collect.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'

export async function packObjects ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  oids,
  write = false
}) {
  try {
    const fs = new FileSystem(_fs)
    const buffers = await pack({ core, dir, gitdir, fs, oids })
    let packfile = await collect(buffers)
    let packfileSha = packfile.slice(-20).toString('hex')
    let filename = `pack-${packfileSha}.pack`
    if (write) {
      await fs.write(join(gitdir, `objects/pack/${filename}`), packfile)
      return { filename }
    }
    return {
      filename,
      packfile
    }
  } catch (err) {
    err.caller = 'git.packObjects'
    throw err
  }
}
