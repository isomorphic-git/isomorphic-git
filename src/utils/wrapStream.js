import pify from 'pify'
import concat from 'simple-concat'

export async function wrapStream (stream) {
  if (stream === undefined) return stream
  // Because of edge case with AWS CodeCommit, stream might actually be a buffer
  if (!stream.on) return stream
  // Browsers can't yet stream uploads
  if (typeof window !== 'undefined') {
    let buffer = await pify(concat)(stream)
    return buffer
  }
  return stream
}
