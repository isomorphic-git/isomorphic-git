import { PassThrough } from 'readable-stream'
import { forAwait } from './forAwait.js'

export function asyncIteratorToStream (iter) {
  let stream = new PassThrough()
  setTimeout(async () => {
    await forAwait(iter, chunk => stream.write(chunk))
    stream.end()
  }, 1)
  return stream
}
