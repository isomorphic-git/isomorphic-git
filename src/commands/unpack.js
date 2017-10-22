// @flow
import { Buffer } from 'buffer'
import { GitObjectManager } from '../managers'
import listpack from 'git-list-pack'
import thru from 'thru'
import peek from 'buffer-peek-stream'
import applyDelta from 'git-apply-delta'
/*::
import type {Writable} from 'stream'
*/

const types = {
  1: 'commit',
  2: 'tree',
  3: 'blob',
  4: 'tag',
  6: 'ofs-delta',
  7: 'ref-delta'
}

function parseVarInt (buffer /*: Buffer */) {
  let n = 0
  for (var i = 0; i < buffer.byteLength; i++) {
    n = (buffer[i] & 0b01111111) + (n << 7)
    if ((buffer[i] & 0b10000000) === 0) {
      if (i !== buffer.byteLength - 1) throw new Error('Invalid varint buffer')
      return n
    }
  }
  throw new Error('Invalid varint buffer')
}

// TODO: Move this to 'plumbing'
export async function unpack (
  {
    gitdir,
    inputStream,
    onprogress
  } /*: {gitdir: string, inputStream: ReadableStream, onprogress: Function} */
) {
  return new Promise(function (resolve, reject) {
    // Read header
    peek(inputStream, 12, (err, data, inputStream) => {
      if (err) return reject(err)
      let iden = data.slice(0, 4).toString('utf8')
      if (iden !== 'PACK') {
        throw new Error(`Packfile started with '${iden}'. Expected 'PACK'`)
      }
      let ver = data.slice(4, 8).toString('hex')
      if (ver !== '00000002') {
        throw new Error(`Unknown packfile version '${ver}'. Expected 00000002.`)
      }
      // Read a 4 byte (32-bit) int
      let numObjects = data.readInt32BE(8)
      if (onprogress !== undefined) {
        onprogress({ loaded: 0, total: numObjects, lengthComputable: true })
      }
      if (numObjects === 0) return resolve()
      // And on our merry way
      let offsetMap = new Map()
      inputStream
        .pipe(listpack())
        .pipe(
          thru(async ({ data, type, reference, offset, num }, next) => {
            type = types[type]
            if (type === 'ref-delta') {
              let oid = Buffer.from(reference).toString('hex')
              try {
                let { object, type } = await GitObjectManager.read({
                  gitdir,
                  oid
                })
                let result = applyDelta(data, object)
                let newoid = await GitObjectManager.write({
                  gitdir,
                  type,
                  object: result
                })
                // console.log(`${type} ${newoid} ref-delta ${oid}`)
                offsetMap.set(offset, newoid)
              } catch (err) {
                throw new Error(
                  `Could not find object ${reference} ${oid} that is referenced by a ref-delta object in packfile at byte offset ${offset}.`
                )
              }
            } else if (type === 'ofs-delta') {
              // Note: this might be not working because offsets might not be
              // guaranteed to be on object boundaries? In which case we'd need
              // to write the packfile to disk first, I think.
              // For now I've "solved" it by simply not advertising ofs-delta as a capability
              // during the HTTP request, so Github will only send ref-deltas not ofs-deltas.
              let absoluteOffset = offset - parseVarInt(reference)
              let referenceOid = offsetMap.get(absoluteOffset)
              // console.log(`${offset} ofs-delta ${absoluteOffset} ${referenceOid}`)
              let { type, object } = await GitObjectManager.read({
                gitdir,
                oid: referenceOid
              })
              let result = applyDelta(data, object)
              let oid = await GitObjectManager.write({
                gitdir,
                type,
                object: result
              })
              // console.log(`${offset} ${type} ${oid} ofs-delta ${referenceOid}`)
              offsetMap.set(offset, oid)
            } else {
              let oid = await GitObjectManager.write({
                gitdir,
                type,
                object: data
              })
              // console.log(`${offset} ${type} ${oid}`)
              offsetMap.set(offset, oid)
            }
            if (onprogress !== undefined) {
              onprogress({
                loaded: numObjects - num,
                total: numObjects,
                lengthComputable: true
              })
            }
            if (num === 0) return resolve()
            next(null)
          })
        )
        .on('error', reject)
        .on('finish', resolve)
    })
  })
}
