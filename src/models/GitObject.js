import { Buffer } from 'buffer'
import pako from 'pako'
import shasum from 'shasum'

/** @ignore */
export class GitObject {
  static wrap ({ type, object } /*: {type: string, object: Buffer} */) {
    let buffer = Buffer.concat([
      Buffer.from(type + ' '),
      Buffer.from(object.byteLength.toString()),
      Buffer.from([0]),
      Buffer.from(object)
    ])
    let oid = shasum(buffer)
    return {
      oid,
      file: Buffer.from(pako.deflate(buffer))
    }
  }
  static unwrap ({ oid, file } /*: {oid: string, file: Buffer} */) {
    let inflated = Buffer.from(pako.inflate(file))
    if (oid) {
      let sha = shasum(inflated)
      if (sha !== oid) {
        throw new Error(`SHA check failed! Expected ${oid}, computed ${sha}`)
      }
    }
    let s = inflated.indexOf(32) // first space
    let i = inflated.indexOf(0) // first null value
    let type = inflated.slice(0, s).toString('utf8') // get type of object
    let length = inflated.slice(s + 1, i).toString('utf8') // get type of object
    let actualLength = inflated.length - (i + 1)
    // verify length
    if (parseInt(length) !== actualLength) {
      throw new Error(
        `Length mismatch: expected ${length} bytes but got ${actualLength} instead.`
      )
    }
    return {
      type,
      object: Buffer.from(inflated.slice(i + 1))
    }
  }
}
