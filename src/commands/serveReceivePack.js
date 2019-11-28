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
    response.push(GitPktLine.encodeSideBand(GitSideBand.MessageChannel, 'Resolving deltas:   0% (0/4)\n'))
    response.push(GitPktLine.encodeSideBand(GitSideBand.PackfileChannel, GitPktLine.encode('unpack ok\n')))
    response.push(GitPktLine.encodeSideBand(GitSideBand.PackfileChannel, GitPktLine.encode('ok refs/heads/master\n')))
    response.push(GitPktLine.encodeSideBand(GitSideBand.MessageChannel, banner))
    response.push(GitPktLine.encodeSideBand(GitSideBand.PackfileChannel, GitPktLine.flush()))
    response.push(GitPktLine.flush())

    return {
      headers: {
        'Content-Type': `application/x-${service}-result`,
        'Cache-Control': 'no-cache, max-age=0, must-revalidate',
      },
      response
    }
  } catch (err) {
    err.caller = 'git.serveReceivePack'
    throw err
  }
}
