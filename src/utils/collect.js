import { forAwait } from './forAwait.js'

export async function collect(iterable) {
  let size = 0
  const buffers = []
  // This will be easier once `for await ... of` loops are available.
  await forAwait(iterable, value => {

    //  catch some unexpected buffer in array of uint8arrays
    if(!value.byteLength){
      let ui8 = new Uint8Array(value.length);
      for (var i = 0; i < value.length; i++) {
        ui8[i] = value[i];
      }
      value = ui8;
    }

    buffers.push(value);
    size += value.byteLength;
  });
  const result = new Uint8Array(size)
  let nextIndex = 0
  for (const buffer of buffers) {
    result.set(buffer, nextIndex)
    nextIndex += buffer.byteLength
  }
  return result
}
