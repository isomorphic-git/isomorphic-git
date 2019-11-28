import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'
import { writeRefsAdResponse } from '../wire/writeRefsAdResponse.js'

/**
 * @param {object} args
 * @param {'git-upload-pack' | 'git-receive-pack'} args.service
 */
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
      'ofs-delta',
      'side-band-64k'
    ]
    if (service === 'git-upload-pack') {
      capabilities.push(
        'no-done',
        'no-thin',
        // 'multi_ack',
        // 'multi_ack_detailed',
        // 'thin-pack',
        // 'shallow',
        // 'deepen-since',
        // 'deepen-not',
        // 'deepen-relative',
        // 'no-progress',
        // 'include-tag',
        // 'filter',
      )
    } else if (service === 'git-receive-pack') {
      capabilities.push(
        'report-status',
        'delete-refs',
        // 'allow-tip-sha1-in-want',
        // 'allow-reachable-sha1-in-want',
        // 'quiet',
        // 'atomic',
        // 'push-options',
        // 'push-cert',
      )
    }

    const refs = {}
    const symrefs = {}

    // Only sent for upload-pack apparently?
    if (service === 'git-upload-pack') {
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
      try {
        // Note: HEAD must be the first in the list.
        refs['HEAD'] = await GitRefManager.resolve({ fs, gitdir, ref: 'HEAD' })
      } catch (e) {
        // noop
      }
    }

    let keys = await GitRefManager.listRefs({
      fs,
      gitdir,
      filepath: 'refs'
    })
    keys = keys.map(ref => `refs/${ref}`)
    // Note: be sure to set HEAD before these other refs (if git-upload-pack)
    for (const key of keys) {
      refs[key] = await GitRefManager.resolve({ fs, gitdir, ref: key })
    }

    const response = await writeRefsAdResponse({
      service,
      capabilities,
      refs,
      symrefs
    })
    return {
      headers: {
        'Content-Type': `application/x-${service}-advertisement`,
        'Cache-Control': 'no-cache, max-age=0, must-revalidate',
      },
      response
    }
  } catch (err) {
    err.caller = 'git.serveInfoRefs'
    throw err
  }
}
