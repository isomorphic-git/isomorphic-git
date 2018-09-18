import { PassThrough } from 'stream'

import { GitPktLine } from '../models/GitPktLine.js'

export async function * writeReceivePackRequest ({
  capabilities = [],
  triplets = []
}) {
  let capsFirstLine = `\0 ${capabilities.join(' ')}`
  for (let trip of triplets) {
    yield GitPktLine.encode(
      `${trip.oldoid} ${trip.oid} ${trip.fullRef}${capsFirstLine}\n`
    )
    capsFirstLine = ''
  }
  return GitPktLine.flush()
}
