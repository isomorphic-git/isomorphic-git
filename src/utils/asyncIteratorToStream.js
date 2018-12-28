import { PassThrough } from 'readable-stream'

export function asyncIteratorToStream(iter) {
  let stream = new PassThrough()
  setTimeout(async () => {
    for await (let chunk of iter) {
      stream.write(chunk)
    }
    stream.end()
  }, 1)
  return stream;
}
