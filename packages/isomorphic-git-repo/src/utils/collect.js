import { forAwait } from './forAwait.js'

export async function collect(iterable) {
  let size = 0
  const buffers = []
  // This will be easier once `for await ... of` loops are available.
  await forAwait(iterable, value => {
    buffers.push(value)
    size += value.byteLength
  })
  const result = new Uint8Array(size)
  let nextIndex = 0
  for (const buffer of buffers) {
    result.set(buffer, nextIndex)
    nextIndex += buffer.byteLength
  }
  return result
}
