import { GitPktLine } from '../models/GitPktLine.js'

export async function writeReceivePackRequest ({
  capabilities = [],
  triplets = []
}) {
  let packstream = []
  let capsFirstLine = `\x00 ${capabilities.join(' ')}`
  for (let trip of triplets) {
    packstream.push(
      GitPktLine.encode(
        `${trip.oldoid} ${trip.oid} ${trip.fullRef}${capsFirstLine}\n`
      )
    )
    capsFirstLine = ''
  }
  packstream.push(GitPktLine.flush())
  return packstream
}
