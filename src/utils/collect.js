import { TinyBuffer } from '../utils/TinyBuffer.js'
import { forAwait } from '../utils/forAwait.js'

export async function collect (iterable) {
  const buffers = []
  // This will be easier once `for await ... of` loops are available.
  await forAwait(iterable, value => buffers.push(TinyBuffer.from(value)))
  return TinyBuffer.concat(buffers)
}
