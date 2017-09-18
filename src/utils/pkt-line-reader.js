//@flow
import BufferCursor from 'buffercursor'

// Technically, this happens to be a pull-stream compatible source.
export default function reader (buffer /*: Buffer */) {
  let buffercursor = new BufferCursor(buffer)
  return function read () {
    if (buffercursor.eof()) return true
    let length = parseInt(buffercursor.slice(4).toString('utf8'), 16)
    console.log('length =', length)
    if (length === 0) return null
    return buffercursor.slice(length - 4).buffer
  }
}
