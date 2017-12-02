// @flow
import { Buffer } from 'buffer'
import { GitObjectManager } from '../managers'
import listpack from 'git-list-pack'
import thru from 'thru'
import peek from 'buffer-peek-stream'
import applyDelta from 'git-apply-delta'
import marky from 'marky'
import { fs as defaultfs, setfs } from '../utils'
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
  { gitdir, fs = defaultfs() },
  {
    inputStream,
    onprogress
  } /*: {gitdir: string, inputStream: ReadableStream, onprogress: Function} */
) {
  setfs(fs)
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
      let totalTime = 0
      let totalApplyDeltaTime = 0
      let totalWriteFileTime = 0
      let totalReadFileTime = 0
      let offsetMap = new Map()
      inputStream
        .pipe(listpack())
        .pipe(
          thru(async ({ data, type, reference, offset, num }, next) => {
            type = types[type]
            marky.mark(`${type} #${num} ${data.length}B`)
            if (type === 'ref-delta') {
              let oid = Buffer.from(reference).toString('hex')
              try {
                marky.mark(`readFile`)
                let { object, type } = await GitObjectManager.read({
                  gitdir,
                  oid
                })
                totalReadFileTime += marky.stop(`readFile`).duration
                marky.mark(`applyDelta`)
                let result = applyDelta(data, object)
                totalApplyDeltaTime += marky.stop(`applyDelta`).duration
                marky.mark(`writeFile`)
                let newoid = await GitObjectManager.write({
                  gitdir,
                  type,
                  object: result
                })
                totalWriteFileTime += marky.stop(`writeFile`).duration
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
              marky.mark(`writeFile`)
              let oid = await GitObjectManager.write({
                gitdir,
                type,
                object: data
              })
              totalWriteFileTime += marky.stop(`writeFile`).duration
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
            let perfentry = marky.stop(`${type} #${num} ${data.length}B`)
            totalTime += perfentry.duration
            if (num === 0) {
              console.log(`Total time unpacking objects: ${totalTime}`)
              console.log(`Total time applying deltas: ${totalApplyDeltaTime}`)
              console.log(`Total time reading files: ${totalReadFileTime}`)
              console.log(`Total time writing files: ${totalWriteFileTime}`)
              return resolve()
            }
            next(null)
          })
        )
        .on('error', reject)
        .on('finish', resolve)
    })
  })
}
