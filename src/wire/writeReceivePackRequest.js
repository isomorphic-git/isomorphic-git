import { GitPktLine } from '../models/GitPktLine.js'

export async function writeReceivePackRequest({
  capabilities = [],
  triplets = [],
}) {
  const packstream = []
  let capsFirstLine = `\x00 ${capabilities.join(' ')}`
  for (const trip of triplets) {
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
