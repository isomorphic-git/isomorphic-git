import { PassThrough } from 'stream'

import { GitPktLine } from '../models/GitPktLine.js'

export async function writeReceivePackRequest ({
  capabilities = [],
  triplets = []
}) {
  let packstream = new PassThrough()
  let capsFirstLine = `\0 ${capabilities.join(' ')}`
  for (let trip of triplets) {
    packstream.write(
      GitPktLine.encode(
        `${trip.oldoid} ${trip.oid} ${trip.fullRef}${capsFirstLine}\n`
      )
    )
    capsFirstLine = ''
  }
  packstream.write(GitPktLine.flush())
  return packstream
}
