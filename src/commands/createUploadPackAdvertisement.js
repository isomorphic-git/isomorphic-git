import path from 'path'

import { GitRefManager } from '../managers'
import { FileSystem } from '../models'

export async function createUploadPackAdvertisement ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs
}) {
  try {
    const fs = new FileSystem(_fs)
    const capabilities = [
      'thin-pack',
      'side-band',
      'side-band-64k',
      'shallow',
      'deepen-since',
      'deepen-not',
      'allow-tip-sha1-in-want',
      'allow-reachable-sha1-in-want'
    ]
    let branches = await GitRefManager.listRefs({
      fs,
      gitdir,
      filepath: 'refs/heads'
    })
    let tags = await GitRefManager.listRefs({
      fs,
      gitdir,
      filepath: 'refs/tags'
    })
    tags = tags.filter(x => !x.endsWith('^{}'))
    const refs = {}
    branches.unshift('HEAD') // HEAD must be the first in the list
    for (const branch of branches) {
      refs[branch] = await GitRefManager.resolve({ fs, gitdir, ref: branch })
    }
    for (const tag of tags) {
      refs[tag] = await GitRefManager.resolve({ fs, gitdir, ref: tag })
    }
    const symrefs = {}
    symrefs['HEAD'] = await GitRefManager.resolve({
      fs,
      gitdir,
      ref: 'HEAD',
      depth: 2
    })
    return {
      capabilities,
      refs,
      symrefs
    }
  } catch (err) {
    err.caller = 'git.createUploadPackAdvertisement'
    throw err
  }
}
