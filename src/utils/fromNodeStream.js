// Convert a Node stream to an Async Iterator
export function fromNodeStream(stream) {
  // Use native async iteration if it's available.
  const asyncIterator = Object.getOwnPropertyDescriptor(
    stream,
    Symbol.asyncIterator
  )
  if (asyncIterator && asyncIterator.enumerable) {
    return stream
  }
  // Author's Note
  // I tried many MANY ways to do this.
  // I tried two npm modules (stream-to-async-iterator and streams-to-async-iterator) with no luck.
  // I tried using 'readable' and .read(), and .pause() and .resume()
  // It took me two loooong evenings to get to this point.
  // So if you are horrified that this solution just builds up a queue with no backpressure,
  // and turns Promises inside out, too bad. This is the first code that worked reliably.
  let ended = false
  const queue = []
  let defer = {}
  stream.on('data', chunk => {
    queue.push(chunk)
    if (defer.resolve) {
      defer.resolve({ value: queue.shift(), done: false })
      defer = {}
    }
  })
  stream.on('error', err => {
    if (defer.reject) {
      defer.reject(err)
      defer = {}
    }
  })
  stream.on('end', () => {
    ended = true
    if (defer.resolve) {
      defer.resolve({ done: true })
      defer = {}
    }
  })
  return {
    next() {
      return new Promise((resolve, reject) => {
        if (queue.length === 0 && ended) {
          return resolve({ done: true })
        } else if (queue.length > 0) {
          return resolve({ value: queue.shift(), done: false })
        } else if (queue.length === 0 && !ended) {
          defer = { resolve, reject }
        }
      })
    },
    return() {
      stream.removeAllListeners()
      if (stream.destroy) stream.destroy()
    },
    [Symbol.asyncIterator]() {
      return this
    },
  }
}
