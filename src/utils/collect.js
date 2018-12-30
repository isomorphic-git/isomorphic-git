import { forAwait } from './forAwait.js'

export async function collect (iterable) {
  let buffers = []
  // This will be easier once `for await ... of` loops are available.
  await forAwait(iterable, value => buffers.push(Buffer.from(value)))
  return Buffer.concat(buffers)
}
