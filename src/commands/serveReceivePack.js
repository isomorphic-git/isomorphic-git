import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'
import { writeRefsAdResponse } from '../wire/writeRefsAdResponse.js'
import { GitPktLine } from '../models/GitPktLine.js'
import { GitSideBand } from '../models/GitSideBand.js'

export async function serveReceivePack ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  service,
  banner
}) {
  const fs = new FileSystem(_fs)
  try {
    const response = []
    response.push(GitPktLine.encodeSideBand(GitSideBand.MessageChannel, 'Hello, World!\n'))
    response.push(GitPktLine.encodeSideBand(GitSideBand.ErrorChannel, 'Unsupported\n'))
    
    return {
      headers: {
        'content-type': `application/x-${service}-result`,
        'pragma': 'no-cache',
        'cache-control': 'no-cache, max-age=0, must-revalidate',
        'vary': 'Accept-Encoding',
      },
      response
    }
  } catch (err) {
    err.caller = 'git.serveReceivePack'
    throw err
  }
}
