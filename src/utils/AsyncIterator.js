// Convert a web ReadableStream (not Node stream!) to an Async Iterator
// adapted from https://jakearchibald.com/2017/async-iterators-and-generators/
export function fromStream(stream) {
  // Use native async iteration if it's available.
  if (stream[Symbol.asyncIterator]) return stream
  const reader = stream.getReader()
  return {
    next() { return reader.read() },
    return() { reader.releaseLock(); return {} },
    [Symbol.asyncIterator]() { return this }
  }
}

// This will be easier with async generator functions.
export function fromBuffer(buffer) {
  const queue = [Buffer.from(buffer)]
  return {
    next() { return Promise.resolve({done: queue.length === 0, value: queue.pop()}) },
    return() { queue = []; return {} },
    [Symbol.asyncIterator]() { return this }
  }
}

// Convert a Node stream to an Async Iterator
export function fromNodeStream(stream) {
  // Use native async iteration if it's available.
  if (stream[Symbol.asyncIterator]) return stream
  stream.pause()
  let ended = false
  return {
    next() {
      return new Promise((resolve, reject) => {
        if (ended) return resolve({done: true})
        stream.once('error', err => {
          stream.removeAllListeners()
          reject(err)
        })
        stream.once('end', () => {
          stream.removeAllListeners()
          ended = true
          resolve({done: true})
        })
        stream.once('readable', () => {
          stream.pause()
          stream.removeAllListeners()
          let buffers = []
          let data = stream.read()
          while (data) {
            buffers.push(data)
            data = stream.read()
          }
          let nextbuffer = Buffer.concat(buffers)
          if (nextbuffer.length === 0) {
            ended = true
            stream.destroy()
          }
          resolve({done: false, value: nextbuffer})
        })
        stream.resume()
      })
    },
    return() {
      stream.pause()
      stream.removeAllListeners()
      return {}
    },
    [Symbol.asyncIterator]() { return this }
  }
}
