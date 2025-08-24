// Convert a web ReadableStream (not Node stream!) to an Async Iterator
// adapted from https://jakearchibald.com/2017/async-iterators-and-generators/
export function fromStream(stream) {
  // Use native async iteration if it's available.
  if (stream[Symbol.asyncIterator]) return stream
  const reader = stream.getReader()
  return {
    next() {
      return reader.read()
    },
    return() {
      reader.releaseLock()
      return {}
    },
    [Symbol.asyncIterator]() {
      return this
    },
  }
}
