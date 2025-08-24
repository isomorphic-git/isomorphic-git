import { GitRefManager } from '../managers/GitRefManager.js'
import { join } from '../utils/join.js'
import { writeRefsAdResponse } from '../wire/writeRefsAdResponse.js'

export async function uploadPack({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  advertiseRefs = false,
}) {
  try {
    if (advertiseRefs) {
      // Send a refs advertisement
      const capabilities = [
        'thin-pack',
        'side-band',
        'side-band-64k',
        'shallow',
        'deepen-since',
        'deepen-not',
        'allow-tip-sha1-in-want',
        'allow-reachable-sha1-in-want',
      ]
      let keys = await GitRefManager.listRefs({
        fs,
        gitdir,
        filepath: 'refs',
      })
      keys = keys.map(ref => `refs/${ref}`)
      const refs = {}
      keys.unshift('HEAD') // HEAD must be the first in the list
      for (const key of keys) {
        refs[key] = await GitRefManager.resolve({ fs, gitdir, ref: key })
      }
      const symrefs = {}
      symrefs.HEAD = await GitRefManager.resolve({
        fs,
        gitdir,
        ref: 'HEAD',
        depth: 2,
      })
      return writeRefsAdResponse({
        capabilities,
        refs,
        symrefs,
      })
    }
  } catch (err) {
    err.caller = 'git.uploadPack'
    throw err
  }
}
