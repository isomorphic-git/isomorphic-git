import { GitPktLine } from '../models/GitPktLine.js'
import { GitSideBand } from '../models/GitSideBand.js'

export async function serveReceivePack (msg) {
  try {
    switch (msg.type) {
      case 'service':
        return {
          headers: {
            'Content-Type': `application/x-${msg.service}-result`,
            'Cache-Control': 'no-cache, max-age=0, must-revalidate',
          }
        }
      case 'unpack':
        return GitPktLine.encodeSideBand(GitSideBand.PackfileChannel, GitPktLine.encode(`unpack ${msg.unpack}\n`))
      case 'ok':
        return GitPktLine.encodeSideBand(GitSideBand.PackfileChannel, GitPktLine.encode(`ok ${msg.ref}\n`))
      case 'ng':
        return GitPktLine.encodeSideBand(GitSideBand.PackfileChannel, GitPktLine.encode(`ng ${msg.ref} ${msg.message}\n`))
      case 'print':
        return GitPktLine.encodeSideBand(GitSideBand.MessageChannel, msg.message)
      case 'fin':
        return Buffer.concat(
          [
            GitPktLine.encodeSideBand(GitSideBand.PackfileChannel, GitPktLine.flush()),
            GitPktLine.flush()
          ]
        )
    }
  } catch (err) {
    err.caller = 'git.serveReceivePack'
    throw err
  }
}
