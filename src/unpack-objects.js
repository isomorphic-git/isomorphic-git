// @flow
import { Buffer } from 'buffer'
import GitObjectManager from './managers/GitObjectManager'
import listpack from 'git-list-pack'
import peek from 'buffer-peek-stream'
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

// TODO: Move this to 'plumbing'
export async function unpack (
  {
    gitdir,
    inputStream
  } /*: {oids: Array<string>, gitdir: string, inputStream: ReadableStream} */
) {
  return new Promise(function (resolve, reject) {
    // git-list-pack doesn't return a proper stream, and
    // doesn't provide a count of how many objects to expect.
    // So for now I'm hacking around that.

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
      console.log(`unpacking ${numObjects} objects`)
      // And on our merry way
      let seenSoFar = 0
      inputStream
        .pipe(listpack())
        .on('data', async ({ data, type, reference, offset, num }) => {
          let obj = {
            gitdir,
            type: types[type],
            object: data
          }
          await GitObjectManager.write(obj)
          seenSoFar++
          if (seenSoFar === numObjects) return resolve()
        })
        .on('error', reject)
        .on('finish', resolve)
    })
  })
}
