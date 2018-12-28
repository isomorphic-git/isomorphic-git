import { getIterator } from './getIterator.js'

export async function collect(iterable) {
  let buffers = []
  // This will be easier once `for await ... of` loops are available.
  let iter = getIterator(iterable)
  while (true) {
    let {value, done} = await iter.next()
    if (value) buffers.push(Buffer.from(value))
    if (done) break
  }
  return Buffer.concat(buffers)
}
