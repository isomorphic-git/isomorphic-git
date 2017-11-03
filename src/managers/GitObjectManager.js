// @flow
import { Buffer } from 'buffer'
import shasum from 'shasum'
import { GitObject } from '../models'
import { read, write, exists } from '../utils'

export class GitObjectManager {
  static async read ({ gitdir, oid } /*: {gitdir: string, oid: string} */) {
    let file = await read(
      `${gitdir}/objects/${oid.slice(0, 2)}/${oid.slice(2)}`
    )
    if (!file) {
      // Check to see if it's in shallow commits.
      let text = await read(`${gitdir}/shallow`, { encoding: 'utf8' })
      if (text !== null && text.includes(oid)) {
        throw new Error(
          `Failed to read git object with oid ${oid} because it is a shallow commit`
        )
      } else {
        throw new Error(`Failed to read git object with oid ${oid}`)
      }
    }
    let { type, object } = GitObject.unwrap({ oid, file })
    return { type, object }
  }

  static async hash ({ gitdir, type, object }) /*: Promise<string> */ {
    let buffer = Buffer.concat([
      Buffer.from(type + ' '),
      Buffer.from(object.byteLength.toString()),
      Buffer.from([0]),
      Buffer.from(object)
    ])
    let oid = shasum(buffer)
    return oid
  }

  static async write (
    {
      gitdir,
      type,
      object
    } /*: {
      gitdir: string,
      type: string,
      object: Buffer
    } */
  ) /*: Promise<string> */ {
    let { file, oid } = GitObject.wrap({ type, object })
    let filepath = `${gitdir}/objects/${oid.slice(0, 2)}/${oid.slice(2)}`
    // Don't overwrite existing git objects - this helps avoid EPERM errors.
    // Although I don't know how we'd fix corrupted objects then. Perhaps delete them
    // on read?
    if (!await exists(filepath)) await write(filepath, file)
    return oid
  }
}
