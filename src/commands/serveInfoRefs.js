import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'
import { writeRefsAdResponse } from '../wire/writeRefsAdResponse.js'

export async function serveInfoRefs ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  service
}) {
  const fs = new FileSystem(_fs)
  try {
    // Send a refs advertisement
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
    let keys = await GitRefManager.listRefs({
      fs,
      gitdir,
      filepath: 'refs'
    })
    keys = keys.map(ref => `refs/${ref}`)
    const refs = {}
    // HEAD must be the first in the list
    try {
      refs['HEAD'] = await GitRefManager.resolve({ fs, gitdir, ref: 'HEAD' })
    } catch (e) {
      // noop
    }
    for (const key of keys) {
      refs[key] = await GitRefManager.resolve({ fs, gitdir, ref: key })
    }
    const symrefs = {}
    try {
      symrefs['HEAD'] = await GitRefManager.resolve({
        fs,
        gitdir,
        ref: 'HEAD',
        depth: 2
      })
    } catch (e) {
      // noop
    }
    const response = await writeRefsAdResponse({
      service,
      capabilities,
      refs,
      symrefs
    })
    return {
      headers: {
        'content-type': `application/x-${service}-advertisement`,
        'pragma': 'no-cache',
        'cache-control': 'no-cache, max-age=0, must-revalidate',
        'vary': 'Accept-Encoding',
      },
      response
    }
  } catch (err) {
    err.caller = 'git.serveInfoRefs'
    throw err
  }
}
