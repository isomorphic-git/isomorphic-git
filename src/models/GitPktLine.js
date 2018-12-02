/**
pkt-line Format
---------------

Much (but not all) of the payload is described around pkt-lines.

A pkt-line is a variable length binary string.  The first four bytes
of the line, the pkt-len, indicates the total length of the line,
in hexadecimal.  The pkt-len includes the 4 bytes used to contain
the length's hexadecimal representation.

A pkt-line MAY contain binary data, so implementors MUST ensure
pkt-line parsing/formatting routines are 8-bit clean.

A non-binary line SHOULD BE terminated by an LF, which if present
MUST be included in the total length. Receivers MUST treat pkt-lines
with non-binary data the same whether or not they contain the trailing
LF (stripping the LF if present, and not complaining when it is
missing).

The maximum length of a pkt-line's data component is 65516 bytes.
Implementations MUST NOT send pkt-line whose length exceeds 65520
(65516 bytes of payload + 4 bytes of length data).

Implementations SHOULD NOT send an empty pkt-line ("0004").

A pkt-line with a length field of 0 ("0000"), called a flush-pkt,
is a special case and MUST be handled differently than an empty
pkt-line ("0004").

----
  pkt-line     =  data-pkt / flush-pkt

  data-pkt     =  pkt-len pkt-payload
  pkt-len      =  4*(HEXDIG)
  pkt-payload  =  (pkt-len - 4)*(OCTET)

  flush-pkt    = "0000"
----

Examples (as C-style strings):

----
  pkt-line          actual value
  ---------------------------------
  "0006a\n"         "a\n"
  "0005a"           "a"
  "000bfoobar\n"    "foobar\n"
  "0004"            ""
----
*/
import streamSource from 'stream-source/index.node.js'

import { BufferCursor } from '../utils/BufferCursor.js'
import { padHex } from '../utils/padHex.js'

// I'm really using this more as a namespace.
// There's not a lot of "state" in a pkt-line

export class GitPktLine {
  static flush () {
    return Buffer.from('0000', 'utf8')
  }

  static encode (line) {
    if (typeof line === 'string') {
      line = Buffer.from(line)
    }
    let length = line.length + 4
    let hexlength = padHex(4, length)
    return Buffer.concat([Buffer.from(hexlength, 'utf8'), line])
  }

  static reader (buffer) {
    let buffercursor = new BufferCursor(buffer)
    return async function read () {
      if (buffercursor.eof()) return true
      let length = parseInt(buffercursor.slice(4).toString('utf8'), 16)
      if (length === 0) return null
      return buffercursor.slice(length - 4)
    }
  }

  // Note: also accepts buffer input for flexibility
  static streamReader (stream) {
    if (!stream.on) return GitPktLine.reader(stream)
    const bufferstream = streamSource(stream)
    return async function read () {
      try {
        let length = await bufferstream.slice(4)
        if (length === null) return true
        length = parseInt(length.toString('utf8'), 16)
        if (length === 0) return null
        let buffer = await bufferstream.slice(length - 4)
        if (buffer === null) return true
        return buffer
      } catch (err) {
        console.log('error', err)
        return true
      }
    }
  }
}
