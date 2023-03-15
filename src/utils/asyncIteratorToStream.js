import { forAwait } from './forAwait.js'

export function asyncIteratorToStream(iter) {
  const { PassThrough } = require('readable-stream')
  const stream = new PassThrough()
  setTimeout(async () => {
    await forAwait(iter, chunk => stream.write(chunk))
    stream.end()
  }, 1)
  return stream
}
