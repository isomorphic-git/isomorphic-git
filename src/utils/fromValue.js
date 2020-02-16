// Convert a value to an Async Iterator
// This will be easier with async generator functions.
export function fromValue(value) {
  let queue = [value]
  return {
    next() {
      return Promise.resolve({ done: queue.length === 0, value: queue.pop() })
    },
    return() {
      queue = []
      return {}
    },
    [Symbol.asyncIterator]() {
      return this
    },
  }
}
